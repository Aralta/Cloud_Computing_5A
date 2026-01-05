export const API_BASE = "http://localhost:3000/api"; //@TODO ADAPTER EN PROD

let tokenProvider = () => "";
let authErrorHandler = () => {};

export function setTokenProvider(fn) {
  tokenProvider = typeof fn === "function" ? fn : () => "";
}

export function setAuthErrorHandler(fn) {
  authErrorHandler = typeof fn === "function" ? fn : () => {};
}

/**Si JSON alors parse, sinon string**/
export async function apiFetch(path, { method = "GET", body, headers = {}, signal } = {}) {
  const token = tokenProvider();
  const finalHeaders = { ...headers };

  const hasBody = body !== undefined && body !== null;
  if (hasBody && !("Content-Type" in finalHeaders)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
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
