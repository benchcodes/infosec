const BASE = "/api";

async function request(path, options) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error ?? `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export const fetchState = () => request("/state");

export const pushCollection = (name, rows) =>
  request(`/${name}`, { method: "PUT", body: JSON.stringify(rows) });

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
