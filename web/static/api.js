// URLs des APIs - à adapter selon l'environnement
export const API_USER_BASE = "http://localhost:3000/api";  // Auth + Users
export const API_METIER_BASE = "http://localhost:3001/api"; // Events

let tokenProvider = () => "";
let authErrorHandler = () => {};

export function setTokenProvider(fn) {
  tokenProvider = typeof fn === "function" ? fn : () => "";
}

export function setAuthErrorHandler(fn) {
  authErrorHandler = typeof fn === "function" ? fn : () => {};
}

/**Si JSON alors parse, sinon string**/
export async function apiFetch(path, { method = "GET", body, headers = {}, signal, useMetierApi = false } = {}) {
  const token = tokenProvider();
  const finalHeaders = { ...headers };

  const hasBody = body !== undefined && body !== null;
  if (hasBody && !("Content-Type" in finalHeaders)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Choisir la bonne base URL selon le type d'API
  const baseUrl = useMetierApi ? API_METIER_BASE : API_USER_BASE;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: finalHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
    signal,
  });

  // Check Auth expired
  if ((res.status === 401 || res.status === 403) && path !== "/auth/login") {
    try {
      authErrorHandler(res);
    } catch {
        //jcrois qu'on est obligé de mettre un catch hein ?
    }
  }

  if (res.status === 204) return null;

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const rawText = await res.text().catch(() => "");
  const trimmed = (rawText || "").trim();

  let data = null;

  if (!trimmed) {
    data = null;
  } else if (ct.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      data = JSON.parse(trimmed);
    } catch {
      data = null;
    }
  } else {
    data = trimmed; // texte brut
  }

  if (!res.ok) {
    const msg = typeof data === "string" ? data : trimmed;
    const err = new Error(`API ${method} ${path} -> ${res.status} ${msg || ""}`.trim());
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
