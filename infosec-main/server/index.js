import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const { MONGO_URI, MONGO_DB = "stockpilot", PORT = 4000, HOST = "127.0.0.1" } = process.env;

if (!MONGO_URI) {
  console.error("MONGO_URI is not set. Copy .env.example to .env first.");
  process.exit(1);
}

export const COLLECTIONS = ["products", "suppliers", "movements", "orders", "users", "audit"];

const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
await client.connect();
const db = client.db(MONGO_DB);
console.log(`Connected to MongoDB database "${MONGO_DB}"`);

// ---------- helpers ----------
// The UI uses string `id`s; Mongo stores them as `_id`. `_pos` keeps the UI's array order.
const toClient = ({ _id, _pos, passwordHash, ...rest }) => ({ id: _id, ...rest }); // eslint-disable-line no-unused-vars

async function readCollection(name) {
  const rows = await db.collection(name).find({}).sort({ _pos: 1 }).toArray();
  return rows.map(toClient);
}

async function replaceCollection(name, rows) {
  const col = db.collection(name);
  const ids = rows.map((row) => row.id);

  if (rows.length > 0) {
    const ops = rows.map(({ id, passwordHash, ...rest }, index) => {
      void passwordHash; // never accept hashes from the browser
      const doc = { ...rest, _pos: index };
      return name === "users"
        ? // $set keeps the stored passwordHash intact
          { updateOne: { filter: { _id: id }, update: { $set: doc }, upsert: true } }
        : { replaceOne: { filter: { _id: id }, replacement: doc, upsert: true } };
    });
    await col.bulkWrite(ops, { ordered: false });
  }
  await col.deleteMany({ _id: { $nin: ids } });
}

function validRows(rows) {
  return (
    Array.isArray(rows) &&
    rows.length <= 5000 &&
    rows.every((row) => row && typeof row === "object" && typeof row.id === "string" && row.id.length > 0)
  );
}

// very small in-memory login throttle: 10 attempts / minute / IP
const attempts = new Map();
function throttled(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > 10;
}

// ---------- app ----------
const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  await db.command({ ping: 1 });
  res.json({ ok: true });
});

app.get("/api/state", async (_req, res) => {
  const entries = await Promise.all(COLLECTIONS.map(async (name) => [name, await readCollection(name)]));
  res.json(Object.fromEntries(entries));
});

app.put("/api/:collection", async (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) return res.status(404).json({ error: "Unknown collection" });
  if (!validRows(req.body)) return res.status(400).json({ error: "Body must be an array of objects with a string id" });
  await replaceCollection(collection, req.body);
  res.json({ ok: true, count: req.body.length });
});

app.post("/api/auth/login", async (req, res) => {
  if (throttled(req.ip)) return res.status(429).json({ error: "Too many attempts. Try again in a minute." });

  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await db.collection("users").findOne({ email: email.trim().toLowerCase() });
  const ok = user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  // same message for unknown email / wrong password / no password set
  if (!ok) return res.status(401).json({ error: "Invalid email or password." });
  if (user.status !== "Active") return res.status(403).json({ error: `This account is ${user.status.toLowerCase()}.` });

  await db.collection("users").updateOne({ _id: user._id }, { $set: { lastActive: new Date().toISOString() } });
  res.json({ name: user.name, email: user.email, role: user.role });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(Number(PORT), HOST, () => console.log(`API listening on http://${HOST}:${PORT}`));
