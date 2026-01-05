import { setAuthErrorHandler, setTokenProvider } from "./api.js";
import { getToken, handleSessionExpired, initAuthUI, login, logout, setLoginError, showCalendar, showLogin } from "./auth.js";
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
    { loginViewEl, calendarViewEl, topbarEl, userInfoEl, loginErrorEl, loginPasswordEl },
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

  //dédouble
  viewersSelectEl.addEventListener("change", () => usersUI.enforceNoOverlap());
  editorsSelectEl.addEventListener("change", () => usersUI.enforceNoOverlapReverse());

  /********************BOOT********************/
  const token = getToken();
  if (!token) showLogin("");
  else showCalendar();
});