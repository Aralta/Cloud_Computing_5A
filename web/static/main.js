import { setAuthErrorHandler, setTokenProvider, apiFetch } from "./api.js";
import { getToken, handleSessionExpired, initAuthUI, login, logout, register, setLoginError, setRegisterError, showCalendar, showLogin, showLoginForm, showRegisterForm } from "./auth.js";
import { configureCalendar, destroyCalendar, ensureCalendarRendered, handleModalDelete, handleModalSubmit, handleRetryUsers, refetchEvents } from "./calendar.js";
import { closeEventModal, getModalState, initModal, isModalOpen } from "./modal.js";
import { createUsersMultiSelectUI } from "./users.js";

document.addEventListener("DOMContentLoaded", () => {
  /********************DOM REFS********************/
  const loginViewEl = document.getElementById("loginView");
  const calendarViewEl = document.getElementById("calendarView");
  const loginFormEl = document.getElementById("loginForm");
  const loginEmailEl = document.getElementById("loginEmail");
  const loginPasswordEl = document.getElementById("loginPassword");
  const loginErrorEl = document.getElementById("loginError");

  // Register refs
  const registerFormEl = document.getElementById("registerForm");
  const registerNameEl = document.getElementById("registerName");
  const registerEmailEl = document.getElementById("registerEmail");
  const registerPasswordEl = document.getElementById("registerPassword");
  const registerPasswordConfirmEl = document.getElementById("registerPasswordConfirm");
  const registerErrorEl = document.getElementById("registerError");
  const authTitleEl = document.getElementById("authTitle");
  const switchToRegisterEl = document.getElementById("switchToRegister");
  const switchToLoginEl = document.getElementById("switchToLogin");

  const topbarEl = document.getElementById("topbar");
  const userInfoEl = document.getElementById("userInfo");
  const logoutBtnEl = document.getElementById("logoutBtn");
  const refreshBtnEl = document.getElementById("refreshBtn");

  const calendarEl = document.getElementById("calendar");

  // Modal refs
  const eventModalEl = document.getElementById("eventModal");
  const eventModalTitleEl = document.getElementById("eventModalTitle");
  const eventFormEl = document.getElementById("eventForm");
  const eventTitleEl = document.getElementById("eventTitle");
  const eventDescEl = document.getElementById("eventDescription");
  const eventStartEl = document.getElementById("eventStart");
  const eventEndEl = document.getElementById("eventEnd");

  const viewersSelectEl = document.getElementById("eventViewers");
  const editorsSelectEl = document.getElementById("eventEditors");
  const usersLoadingHintEl = document.getElementById("usersLoadingHint");
  const retryUsersBtnEl = document.getElementById("retryUsersBtn");

  const modalCancelBtnEl = document.getElementById("modalCancelBtn");
  const modalSubmitBtnEl = document.getElementById("modalSubmitBtn");
  const modalDeleteBtnEl = document.getElementById("modalDeleteBtn");
  
  // Admin console refs (cachée)
  const adminConsoleModalEl = document.getElementById("adminConsoleModal");
  const adminPasswordEl = document.getElementById("adminPassword");
  const adminPurgeBtnEl = document.getElementById("adminPurgeBtn");
  const adminCancelBtnEl = document.getElementById("adminCancelBtn");
  const adminConsoleMsgEl = document.getElementById("adminConsoleMsg");

  /********************INIT MODULES********************/
  //Modal
  initModal({
    eventModalEl,
    eventModalTitleEl,
    eventFormEl,
    eventTitleEl,
    eventDescEl,
    eventStartEl,
    eventEndEl,
    modalCancelBtnEl,
    modalSubmitBtnEl,
    modalDeleteBtnEl,
    retryUsersBtnEl,
    viewersSelectEl,
    editorsSelectEl,
  });

  //usersUI 
  const usersUI = createUsersMultiSelectUI({ viewersSelectEl, editorsSelectEl, usersLoadingHintEl });
  configureCalendar({ usersUIController: usersUI });

  //authUI
  initAuthUI(
    { 
      loginViewEl, 
      calendarViewEl, 
      topbarEl, 
      userInfoEl, 
      loginErrorEl, 
      loginPasswordEl,
      loginFormEl,
      registerFormEl,
      registerErrorEl,
      authTitleEl,
      switchToRegisterEl,
      switchToLoginEl,
    },
    {
      onEnterLogin: () => {
        // Nettoyage centralisé quand on repasse au login
        closeEventModal();
        destroyCalendar();
      },
      onEnterCalendar: () => {
        ensureCalendarRendered(calendarEl);
      },
    }
  );

  //API
  setTokenProvider(() => getToken());
  setAuthErrorHandler(() => handleSessionExpired());

  /********************WIRING EVENTS********************/
  //login
  loginFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (loginEmailEl.value || "").trim();
    const password = loginPasswordEl.value || "";

    if (!email || !password) {
      setLoginError("Email et mot de passe requis.");
      return;
    }

    const submitBtn = loginFormEl.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setLoginError("");

    try {
      await login(email, password);
      showCalendar();
    } catch (err) {
      console.error(err);
      setLoginError("Connexion impossible. Vérifiez les identifiants.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  //logout
  logoutBtnEl.addEventListener("click", () => logout());

  //switch to register
  switchToRegisterEl.addEventListener("click", (e) => {
    e.preventDefault();
    showRegisterForm();
  });

  //switch to login
  switchToLoginEl.addEventListener("click", (e) => {
    e.preventDefault();
    showLoginForm();
  });

  //register form
  registerFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = (registerNameEl.value || "").trim();
    const email = (registerEmailEl.value || "").trim();
    const password = registerPasswordEl.value || "";
    const passwordConfirm = registerPasswordConfirmEl.value || "";

    if (!name || !email || !password) {
      setRegisterError("Tous les champs sont requis.");
      return;
    }

    if (password.length < 6) {
      setRegisterError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== passwordConfirm) {
      setRegisterError("Les mots de passe ne correspondent pas.");
      return;
    }

    const submitBtn = registerFormEl.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setRegisterError("");

    try {
      await register(name, email, password);
      showCalendar();
    } catch (err) {
      console.error(err);
      const msg = err?.message?.includes("409") ? "Cet email est déjà utilisé." : "Inscription impossible. Réessayez.";
      setRegisterError(msg);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  //refresh
  refreshBtnEl.addEventListener("click", () => refetchEvents());

  //Modal close
  modalCancelBtnEl.addEventListener("click", () => closeEventModal());

  //Modal submit
  eventFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleModalSubmit();
  });

  //Modal delete
  modalDeleteBtnEl.addEventListener("click", async () => {
    await handleModalDelete();
  });

  //retry users
  retryUsersBtnEl.addEventListener("click", async () => {
    await handleRetryUsers();
  });

  //click out close
  eventModalEl.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.dataset && target.dataset.close === "1") closeEventModal();
  });

  //escape to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isModalOpen()) closeEventModal();
  });

  // Admin console: ouvrir avec Ctrl+Alt+P (cachée par défaut)
  function showAdminConsole() {
    if (!adminConsoleModalEl) return;
    adminConsoleModalEl.classList.remove("hidden");
    document.body.classList.add("modal-open");
    if (adminPasswordEl) adminPasswordEl.focus();
  }

  function closeAdminConsole() {
    if (!adminConsoleModalEl) return;
    adminConsoleModalEl.classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (adminPasswordEl) adminPasswordEl.value = "";
    if (adminConsoleMsgEl) {
      adminConsoleMsgEl.textContent = "";
      adminConsoleMsgEl.classList.add("hidden");
    }
  }

  document.addEventListener("keydown", (e) => {
    // Accept either 'p' key or physical KeyP and be robust to caps/keyboard layouts
    const isP = (e.key && e.key.toLowerCase() === "p") || (e.code && e.code === "KeyP");
    if (e.ctrlKey && e.altKey && isP) {
      // toggle
      if (adminConsoleModalEl && adminConsoleModalEl.classList.contains("hidden")) showAdminConsole();
      else closeAdminConsole();
    }
  });

  if (adminCancelBtnEl) adminCancelBtnEl.addEventListener("click", () => closeAdminConsole());

  if (adminPurgeBtnEl) {

    adminPurgeBtnEl.addEventListener("click", async () => {
      const pwd = adminPasswordEl?.value || "";
      if (!pwd) {
        if (adminConsoleMsgEl) {
          adminConsoleMsgEl.textContent = "Entrez le mot de passe.";
          adminConsoleMsgEl.classList.remove("hidden");
        }
        return;
      }

      const confirmed = confirm("Confirmer la purge des deux bases ? Cette opération est irréversible.");
      if (!confirmed) return;

      // Disable UI
      adminPurgeBtnEl.disabled = true;
      adminCancelBtnEl.disabled = true;

      try {
        // Purge users (api-user)
        await apiFetch(`/admin/purge`, { method: "POST", body: { password: pwd }, useMetierApi: false });
        // Purge events (api-metier)
        await apiFetch(`/admin/purge`, { method: "POST", body: { password: pwd }, useMetierApi: true });

        if (adminConsoleMsgEl) {
          adminConsoleMsgEl.textContent = "Purge effectuée sur les deux bases.";
          adminConsoleMsgEl.classList.remove("hidden");
        }
      } catch (err) {
        console.error(err);
        if (adminConsoleMsgEl) {
          adminConsoleMsgEl.textContent = "Erreur lors de la purge. Vérifiez le mot de passe et les logs serveur.";
          adminConsoleMsgEl.classList.remove("hidden");
        }
      } finally {
        adminPurgeBtnEl.disabled = false;
        adminCancelBtnEl.disabled = false;
      }
    });
  }

  //dédouble
  viewersSelectEl.addEventListener("change", () => usersUI.enforceNoOverlap());
  editorsSelectEl.addEventListener("change", () => usersUI.enforceNoOverlapReverse());

  /********************BOOT********************/
  const token = getToken();
  if (!token) showLogin("");
  else showCalendar();
});