const BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "tf_token";

let token = typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export const getToken = () => token;
export const setToken = (t) => {
  token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error || `HTTP ${res.status}`, res.status, data?.code);
  }
  return data;
}

const get  = (p)    => request("GET", p);
const post = (p, b) => request("POST", p, b);
const patch = (p, b) => request("PATCH", p, b);
const put  = (p, b) => request("PUT", p, b);
const del  = (p)    => request("DELETE", p);

export const api = {
  auth: {
    login:    (email, password, role) => post("/auth/login", { email, password, role }),
    register: (data)                  => post("/auth/register", data),
    me:       ()                      => get("/auth/me"),
  },
  users: {
    list:   ()        => get("/users"),
    create: (data)    => post("/users", data),
    update: (id, data)=> patch(`/users/${id}`, data),
    remove: (id)      => del(`/users/${id}`),
  },
  tasks: {
    list:   (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return get(`/tasks${q ? `?${q}` : ""}`);
    },
    create:   (data)    => post("/tasks", data),
    update:   (id, data)=> patch(`/tasks/${id}`, data),
    remove:   (id)      => del(`/tasks/${id}`),
    activity: (id)      => get(`/tasks/${id}/activity`),
    children: (id)      => get(`/tasks/${id}/children`),
  },
  remarks: {
    list:   (taskId)             => get(`/tasks/${taskId}/remarks`),
    add:    (taskId, body)       => post(`/tasks/${taskId}/remarks`, { body }),
    remove: (taskId, remarkId)   => del(`/tasks/${taskId}/remarks/${remarkId}`),
  },
  settings: {
    get:  ()      => get("/settings"),
    save: (perms) => put("/settings", perms),
  },
  sprints: {
    list:   ()        => get("/sprints"),
    create: (data)    => post("/sprints", data),
    update: (id, data)=> patch(`/sprints/${id}`, data),
    remove: (id)      => del(`/sprints/${id}`),
  },
  transitions: {
    list:    ()           => get("/transitions"),
    replace: (transitions)=> put("/transitions", { transitions }),
  },
};
