const BASE = "/api";
const TIMEOUT_MS = 6000;

async function request(path, options) {
  // Do not let a dead API server leave the UI waiting forever.
  const signal = globalThis.AbortSignal?.timeout?.(TIMEOUT_MS);
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    signal,
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

export const createCustomerOrder = (order) =>
  request("/customer-orders", { method: "POST", body: JSON.stringify(order) });

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const changePassword = (email, currentPassword, newPassword) =>
  request("/auth/password", {
    method: "POST",
    body: JSON.stringify({ email, currentPassword, newPassword }),
  });
