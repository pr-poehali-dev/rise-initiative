const AUTH_URL = "https://functions.poehali.dev/a6457bac-e0e6-4a5e-b44c-3056d8fe7bf5";
const TASKS_URL = "https://functions.poehali.dev/7d854006-676c-481c-98ef-abdb5616c2bf";
const NOTIFY_URL = "https://functions.poehali.dev/a81b1bf7-6427-4ee2-9d5f-e67e5123140a";

export const SESSION_KEY = "tm_session_id";

function getSession() {
  return localStorage.getItem(SESSION_KEY) || "";
}

function authHeaders() {
  return { "Content-Type": "application/json", "X-Session-Id": getSession() };
}

export async function register(name: string, email: string, password: string) {
  const r = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return r.json();
}

export async function login(email: string, password: string) {
  const r = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

export async function logout() {
  await fetch(`${AUTH_URL}/logout`, { method: "POST", headers: authHeaders() });
  localStorage.removeItem(SESSION_KEY);
}

export async function getMe() {
  const r = await fetch(`${AUTH_URL}/me`, { headers: authHeaders() });
  return r.json();
}

export async function getUsers() {
  const r = await fetch(`${AUTH_URL}/users`, { headers: authHeaders() });
  return r.json();
}

export async function getTasks() {
  const r = await fetch(`${TASKS_URL}/tasks`, { headers: authHeaders() });
  return r.json();
}

export async function createTask(data: Record<string, unknown>) {
  const r = await fetch(`${TASKS_URL}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function updateTask(id: number, data: Record<string, unknown>) {
  const r = await fetch(`${TASKS_URL}/tasks/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function deleteTask(id: number) {
  const r = await fetch(`${TASKS_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return r.json();
}

export async function sendNotify(task_id: number, assignee_ids: number[]) {
  await fetch(`${NOTIFY_URL}/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ task_id, assignee_ids }),
  });
}
