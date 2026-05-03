/**
 * Тонкий клиент REST API сервера.
 * Все методы возвращают promise; ошибки HTTP пробрасываются.
 */
const API = "/api";

async function request(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listWorks: () => request("/works"),
  createWork: (work) =>
    request("/works", { method: "POST", body: JSON.stringify(work) }),
  updateWork: (id, work) =>
    request(`/works/${id}`, { method: "PUT", body: JSON.stringify(work) }),
  deleteWork: (id) => request(`/works/${id}`, { method: "DELETE" }),

  listEstimates: () => request("/estimates"),
  saveEstimate: (data) =>
    request("/estimates", { method: "POST", body: JSON.stringify(data) }),
  loadEstimate: (id) => request(`/estimates/${id}`),
  deleteEstimate: (id) => request(`/estimates/${id}`, { method: "DELETE" }),
};
