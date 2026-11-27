import "dotenv/config";
import dns from "node:dns";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { seedState } from "../src/lib/seed.js";

const {
  MONGO_URI,
  MONGO_DB = "stockpilot",
  MONGO_DNS_SERVERS,
  SEED_DEMO_PASSWORD = "demo1234",
} = process.env;

// Honour the same DNS override the API uses for Atlas SRV lookups.
if (MONGO_DNS_SERVERS !== undefined) {
  const dnsServers = MONGO_DNS_SERVERS.split(",").map((server) => server.trim());
  if (dnsServers.some((server) => server.length === 0)) {
    throw new Error("MONGO_DNS_SERVERS must be a comma-separated list of DNS server IP addresses.");
  }
  dns.setServers(dnsServers);
}

if (!MONGO_URI) {
  console.error("MONGO_URI is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });

try {
  await client.connect();
  const db = client.db(MONGO_DB);
  const passwordHash = await bcrypt.hash(SEED_DEMO_PASSWORD, 12);

  for (const [name, rows] of Object.entries(seedState)) {
    const docs = rows.map(({ id, ...rest }, index) => ({
      _id: id,
      ...rest,
      _pos: index,
      ...(name === "users" ? { email: rest.email.toLowerCase(), passwordHash } : {}),
    }));
    const col = db.collection(name);
    await col.deleteMany({});
    if (docs.length) await col.insertMany(docs);
    console.log(`  ${name.padEnd(10)} ${docs.length} documents`);
  }

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("products").createIndex({ sku: 1 });
  await db.collection("movements").createIndex({ productId: 1, at: -1 });

  console.log(
    `\nSeeded "${MONGO_DB}". Demo login: ${
      seedState.users.find((user) => user.role === "Admin")?.email ?? "admin@ctinassl.ph"
    } / ${SEED_DEMO_PASSWORD}`,
  );
} catch (error) {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
