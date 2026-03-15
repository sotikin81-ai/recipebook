// ─── Простой API-клиент (без зависимостей) ───────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let accessToken = localStorage.getItem("access_token") || null;
let refreshToken = localStorage.getItem("refresh_token") || null;

function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (access)  localStorage.setItem("access_token",  access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error("No refresh token");
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) { clearTokens(); throw new Error("Session expired"); }
  const data = await res.json();
  setTokens(data.accessToken, refreshToken);
  return data.accessToken;
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  let res = await fetch(`${BASE_URL}${path}`, opts);

  // Попытка refresh при 401
  if (res.status === 401 && refreshToken) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
    } catch {
      clearTokens();
      window.location.href = "/";
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: res.status, data });
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  register: (body) => request("POST", "/auth/register", body).then(d => { setTokens(d.accessToken, d.refreshToken); return d; }),
  login:    (body) => request("POST", "/auth/login",    body).then(d => { setTokens(d.accessToken, d.refreshToken); return d; }),
  logout:   ()     => request("POST", "/auth/logout",   { refreshToken }).finally(clearTokens),
  isLoggedIn: ()   => !!accessToken,
};

// ─── Recipes ──────────────────────────────────────────────────────────────────
export const recipes = {
  list:    (params = {}) => request("GET",    `/recipes?${new URLSearchParams(params)}`),
  get:     (id)          => request("GET",    `/recipes/${id}`),
  create:  (body)        => request("POST",   "/recipes", body),
  update:  (id, body)    => request("PUT",    `/recipes/${id}`, body),
  delete:  (id)          => request("DELETE", `/recipes/${id}`),
  rate:    (id, score)   => request("POST",   `/recipes/${id}/rate`, { score }),
  favorite:(id)          => request("POST",   `/recipes/${id}/favorite`),
  comments:(id)          => request("GET",    `/recipes/${id}/comments`),
  addComment:(id, content) => request("POST", `/recipes/${id}/comments`, { content }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = {
  me:        ()      => request("GET",  "/users/me"),
  get:       (id)    => request("GET",  `/users/${id}`),
  update:    (body)  => request("PUT",  "/users/me", body),
  recipes:   (id)    => request("GET",  `/users/${id}/recipes`),
  favorites: ()      => request("GET",  "/users/me/favorites"),
};

// ─── Match ────────────────────────────────────────────────────────────────────
export const match = {
  find:         (ingredients) => request("POST", "/match", { ingredients }),
  shoppingList: (recipeIds, userIngredients) => request("POST", "/match/shopping-list", { recipeIds, userIngredients }),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const ai = {
  analyzePhoto: (file) => {
    const fd = new FormData();
    fd.append("photo", file);
    return request("POST", "/ai/analyze-photo", fd, true);
  },
  substitute:     (ingredient, context) => request("POST", "/ai/suggest-substitute", { ingredient, recipe_context: context }),
  generateRecipe: (ingredients, mood)   => request("POST", "/ai/generate-recipe",   { ingredients, mood }),
};
