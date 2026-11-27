// Demo accounts. These let the app run when the API or MongoDB is not available,
// which is useful for classroom demos and offline screenshots.
//
// When the API is reachable, server/index.js checks the password against the
// bcrypt hash stored in MongoDB and these local accounts are never used.
export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS = [
  { name: "Florencio Contreras", email: "admin@ctinassl.ph", role: "Admin" },
  { name: "Bench Culubong", email: "employee@ctinassl.ph", role: "Employee" },
  { name: "Lawrence Abad", email: "user@ctinassl.ph", role: "User" },
];

export function localLogin(email, password) {
  const target = String(email ?? "").trim().toLowerCase();
  const match = DEMO_ACCOUNTS.find((account) => account.email.toLowerCase() === target);
  if (!match || password !== DEMO_PASSWORD) return null;
  return { ...match };
}
