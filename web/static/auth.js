import { apiFetch } from "./api.js";
import { resetUsersCache } from "./users.js";

/********************VAR AUTH********************/
const LOGIN_PATH = "/auth/login";
const REGISTER_PATH = "/auth/register";
const STORAGE_TOKEN_KEY = "accessToken";
const STORAGE_USER_KEY = "currentUser";

// Champs attendus (correspondent à l'API User)
const LOGIN_REQ_EMAIL_FIELD = "email";
const LOGIN_REQ_PASSWORD_FIELD = "password";
const LOGIN_RES_TOKEN_FIELD = "access_token";  // snake_case depuis l'API
const LOGIN_RES_USER_FIELD = "user";

/********************DOM REFS********************/
//INJECTED
let loginViewEl = null;
let calendarViewEl = null;
let topbarEl = null;
let userInfoEl = null;

let loginErrorEl = null;
let loginPasswordEl = null;
let loginFormEl = null;

let registerFormEl = null;
let registerErrorEl = null;
let authTitleEl = null;
let switchToRegisterEl = null;
let switchToLoginEl = null;

/********************Hooks********************/
//INJECTED pour que auth puisse clean
let onEnterLogin = () => {};
let onEnterCalendar = () => {};

/************************SESSION HELPERS*****************************/
export function getToken() {
  return localStorage.getItem(STORAGE_TOKEN_KEY) || "";
}

export function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

/************************UI HELPERS*****************************/
export function initAuthUI(refs, hooks = {}) {
  loginViewEl = refs.loginViewEl;
  calendarViewEl = refs.calendarViewEl;
  topbarEl = refs.topbarEl;
  userInfoEl = refs.userInfoEl;
  loginErrorEl = refs.loginErrorEl;
  loginPasswordEl = refs.loginPasswordEl;
  loginFormEl = refs.loginFormEl;
  
  registerFormEl = refs.registerFormEl;
  registerErrorEl = refs.registerErrorEl;
  authTitleEl = refs.authTitleEl;
  switchToRegisterEl = refs.switchToRegisterEl;
  switchToLoginEl = refs.switchToLoginEl;

  onEnterLogin = typeof hooks.onEnterLogin === "function" ? hooks.onEnterLogin : () => {};
  onEnterCalendar = typeof hooks.onEnterCalendar === "function" ? hooks.onEnterCalendar : () => {};
}

export function setLoginError(msg) {
  if (!loginErrorEl) return;

  if (!msg) {
    loginErrorEl.textContent = "";
    loginErrorEl.classList.add("hidden");
    return;
  }

  loginErrorEl.textContent = msg;
  loginErrorEl.classList.remove("hidden");
}

export function showLogin(message = "") {
  try {
    onEnterLogin();
  } catch {
    //obligé obligé
  }

  if (loginViewEl) loginViewEl.classList.remove("hidden");
  if (calendarViewEl) calendarViewEl.classList.add("hidden");
  if (topbarEl) topbarEl.classList.add("hidden");

  setLoginError(message);

  if (loginPasswordEl) loginPasswordEl.value = "";
}

export function showCalendar() {
  if (loginViewEl) loginViewEl.classList.add("hidden");
  if (calendarViewEl) calendarViewEl.classList.remove("hidden");
  if (topbarEl) topbarEl.classList.remove("hidden");

  const user = getCurrentUser();
  if (userInfoEl) {
    if (user?.name) userInfoEl.textContent = `${user.name} (${user.email || ""})`.trim();
    else if (user?.email) userInfoEl.textContent = user.email;
    else userInfoEl.textContent = "";
  }

  try {
    onEnterCalendar();
  } catch {
    //toujours
  }
}

/************************AUTH METIER*****************************/
export async function login(email, password) {
  setLoginError("");

  const payload = {
    [LOGIN_REQ_EMAIL_FIELD]: email,
    [LOGIN_REQ_PASSWORD_FIELD]: password,
  };

  const data = await apiFetch(LOGIN_PATH, { method: "POST", body: payload });

  const token = data?.[LOGIN_RES_TOKEN_FIELD];
  const user = data?.[LOGIN_RES_USER_FIELD];

  if (!token || !user) {
    throw new Error("Réponse login invalide (token/user manquant).");
  }

  setSession(token, user);
  resetUsersCache();
}

export function logout() {
  clearSession();
  resetUsersCache();
  showLogin("");
}

export function handleSessionExpired() {
  clearSession();
  resetUsersCache();
  showLogin("Session expirée, reconnection obligatoire.");
}

/************************REGISTER*****************************/
export function setRegisterError(msg) {
  if (!registerErrorEl) return;

  if (!msg) {
    registerErrorEl.textContent = "";
    registerErrorEl.classList.add("hidden");
    return;
  }

  registerErrorEl.textContent = msg;
  registerErrorEl.classList.remove("hidden");
}

export async function register(name, email, password) {
  setRegisterError("");

  const payload = {
    name,
    email,
    password,
  };

  const data = await apiFetch(REGISTER_PATH, { method: "POST", body: payload });

  const token = data?.[LOGIN_RES_TOKEN_FIELD];
  const user = data?.[LOGIN_RES_USER_FIELD];

  if (!token || !user) {
    throw new Error("Réponse register invalide (token/user manquant).");
  }

  setSession(token, user);
  resetUsersCache();
}

export function showRegisterForm() {
  if (loginFormEl) loginFormEl.classList.add("hidden");
  if (registerFormEl) registerFormEl.classList.remove("hidden");
  if (authTitleEl) authTitleEl.textContent = "Inscription";
  if (switchToRegisterEl) switchToRegisterEl.classList.add("hidden");
  if (switchToLoginEl) switchToLoginEl.classList.remove("hidden");
  setLoginError("");
  setRegisterError("");
}

export function showLoginForm() {
  if (loginFormEl) loginFormEl.classList.remove("hidden");
  if (registerFormEl) registerFormEl.classList.add("hidden");
  if (authTitleEl) authTitleEl.textContent = "Connexion";
  if (switchToRegisterEl) switchToRegisterEl.classList.remove("hidden");
  if (switchToLoginEl) switchToLoginEl.classList.add("hidden");
  setLoginError("");
  setRegisterError("");
}
