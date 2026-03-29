const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function request(path, options = {}) {
  const { method = "GET", body, token } = options;
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || "Request failed";
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/api/auth/me", { token }),
  listExpenses: (token, scope = "mine") =>
    request(`/api/expenses?scope=${scope}`, { token }),
  createExpense: (token, payload) =>
    request("/api/expenses", { method: "POST", body: payload, token }),
  pendingApprovals: (token) => request("/api/approvals/pending", { token }),
  decideApproval: (token, expenseId, payload) =>
    request(`/api/approvals/${expenseId}/decision`, {
      method: "POST",
      body: payload,
      token,
    }),
  listUsers: (token) => request("/api/users", { token }),
  createUser: (token, payload) =>
    request("/api/users", { method: "POST", body: payload, token }),
  updateRule: (token, payload) =>
    request("/api/rules/approval-rule", { method: "PUT", body: payload, token }),
  getRule: (token) => request("/api/rules/approval-rule", { token }),
  getSteps: (token) => request("/api/rules/approval-steps", { token }),
  updateSteps: (token, payload) =>
    request("/api/rules/approval-steps", { method: "PUT", body: payload, token }),
  exchangeRate: (base, symbols) =>
    request(`/api/exchange-rate?base=${base}&symbols=${symbols}`),
};
