import { apiFetch } from "./api.js";
import { getCurrentUser } from "./auth.js";
import { getUsersCache, loadUsers } from "./users.js";
import {
  closeEventModal,
  getModalState,
  getModalSelectEls,
  openCreateModal,
  openEditModal,
  openViewModal,
  readFormBasics,
  setModalBusy,
  toIsoOrNull,
} from "./modal.js";

let calendar = null;
let usersUI = null; //INJECTED

export function configureCalendar({ usersUIController }) {
  usersUI = usersUIController;
}

export function destroyCalendar() {
  if (!calendar) return;
  try {
    calendar.destroy();
  } catch (e) {
    console.warn("calendar.destroy() failed:", e);
  }
  calendar = null;
}

export function refetchEvents() {
  if (calendar) calendar.refetchEvents();
}

export function ensureCalendarRendered(calendarEl) {
  if (calendar) return;
  initAndRenderCalendar(calendarEl);
}

/************************EVENT MAPPING*****************************/
/*back expects (title, description, start, end, viewers, editors)*/
function fcEventToApiPayload(fcEvent) {
  return {
    title: fcEvent.title || "",
    description: fcEvent.extendedProps.description || "",
    start: toIsoOrNull(fcEvent.start),
    end: toIsoOrNull(fcEvent.end),
    viewers: fcEvent.extendedProps.viewUserIds || [],
    editors: fcEvent.extendedProps.editUserIds || [],
  };
}

function apiEventToFcEvent(apiEv) {
  const eventId = apiEv?.eventId ?? apiEv?.id ?? null;

  const fc = {
    id: eventId ? String(eventId) : undefined,
    title: apiEv.title,
    start: apiEv.start,
    end: apiEv.end,
    extendedProps: {
      backendEventId: eventId,
      ownerId: apiEv.owner_id,            // API retourne "owner_id"
      description: apiEv.description || "",
      viewUserIds: apiEv.viewers || [],   // API retourne "viewers"
      editUserIds: apiEv.editors || [],   // API retourne "editors"
    },
  };

  return applyRandomColors(fc, eventId);
}

function normalizeCreatedEvent(apiCreated, fallbackPayload) {
  const eventId = apiCreated?.id ?? null;  // API retourne "id"

  const title = apiCreated?.title ?? fallbackPayload.title ?? "";
  const description = apiCreated?.description ?? fallbackPayload.description ?? "";
  const start = apiCreated?.start ?? fallbackPayload.start ?? null;
  const end = apiCreated?.end ?? fallbackPayload.end ?? null;
  const ownerId = apiCreated?.owner_id ?? null;  // API retourne "owner_id"
  const viewUserIds = apiCreated?.viewers ?? fallbackPayload.viewers ?? [];  // "viewers"
  const editUserIds = apiCreated?.editors ?? fallbackPayload.editors ?? [];  // "editors"

  const fc = {
    id: eventId ? String(eventId) : undefined,
    title,
    start,
    end,
    extendedProps: {
      backendEventId: eventId,
      ownerId,
      description,
      viewUserIds,
      editUserIds,
    },
  };

  return applyRandomColors(fc, eventId);
}

/**********************USERS IN MODAL*************************/
async function ensureUsersReadyForModal() {
  if (!usersUI) return;

  if (getUsersCache()) {
    return;
  }

  usersUI.showUsersLoading("Chargement des utilisateurs…");

  try {
    await loadUsers();

    // Si le modal a été fermé pendant le fetch, on ne touche plus au DOM
    if (!getModalState()) return;

    usersUI.renderUsersIntoMultiSelects({ selectedViewers: [], selectedEditors: [] });
  } catch (e) {
    console.error("Impossible de charger /users:", e);
    usersUI.showUsersLoading("Erreur de chargement");
  }
}

function renderUsersForCurrentModal() {
  if (!usersUI) return;

  const st = getModalState();
  if (!st) return;

  const selectedViewers = st.mode === "edit" ? st.snapshot.viewUserIds : [];
  const selectedEditors = st.mode === "edit" ? st.snapshot.editUserIds : [];

  usersUI.renderUsersIntoMultiSelects({ selectedViewers, selectedEditors });
}

/**********************FULLCALENDAR*************************/
async function loadEvents(fetchInfo, successCallback, failureCallback) {
  try {
    // L'API events ne supporte pas les paramètres start/end, on récupère tout
    const data = await apiFetch(`/events`, { useMetierApi: true });
    const fcEvents = (data || []).map(apiEventToFcEvent);

    successCallback(fcEvents);
  } catch (e) {
    console.error(e);
    failureCallback(e);
  }
}

function onSelectOpenCreateModal(info) {
  if (calendar) calendar.unselect();
  openCreateModal({ start: info.start, end: info.end });

  renderUsersForCurrentModal();
  ensureUsersReadyForModal();
}

async function onUpdateEvent(info) {
  const fcEvent = info.event;
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  
  const ownerId = fcEvent.extendedProps.ownerId;
  const editUserIds = fcEvent.extendedProps.editUserIds || [];
  
  // Vérifier si l'utilisateur peut éditer
  const canEdit = currentUserId === ownerId || editUserIds.includes(currentUserId);
  
  if (!canEdit) {
    alert("Vous n'avez pas les droits pour modifier cet événement.");
    info.revert();
    return;
  }

  const backendId = fcEvent.extendedProps.backendEventId;

  if (!backendId) {
    alert("Cet event n'a pas d'ID backend (création pas confirmée ?).");
    info.revert();
    return;
  }

  try {
    const payload = fcEventToApiPayload(info.event);
    await apiFetch(`/events/${backendId}`, { method: "PUT", body: payload, useMetierApi: true });
  } catch (e) {
    console.error(e);
    alert("Update refusée par le backend. Oups");
    info.revert();
  }
}

function onEventClickOpenEditModal(clickInfo) {
  clickInfo.jsEvent?.preventDefault?.();
  
  const fcEvent = clickInfo.event;
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  
  const ownerId = fcEvent.extendedProps.ownerId;
  const editUserIds = fcEvent.extendedProps.editUserIds || [];
  
  // Vérifier si l'utilisateur peut éditer (owner ou editor)
  const canEdit = currentUserId === ownerId || editUserIds.includes(currentUserId);
  
  if (canEdit) {
    openEditModal(fcEvent);
    renderUsersForCurrentModal();
    ensureUsersReadyForModal();
  } else {
    // L'utilisateur est seulement viewer -> mode lecture seule
    openViewModal(fcEvent);
  }
}

/********************CALENDAR CONFIG******************************/
function initAndRenderCalendar(calendarEl) {
  const FullCalendarGlobal = window.FullCalendar;
  if (!FullCalendarGlobal) {
    throw new Error("FullCalendar n'est pas chargé (CDN manquant ?).");
  }

  calendar = new FullCalendarGlobal.Calendar(calendarEl, {
    timeZone: "local",
    initialView: "timeGridWeek",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek",
    },

    editable: true,
    selectable: true,

    slotMinTime: "06:00:00",
    slotMaxTime: "21:00:00",
    slotLabelFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
    eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },

    height: "auto",
    expandRows: true, //utile ??
    nowIndicator: true, //utile
    allDaySlot: false, //inutile
    locale: "fr", //utile ?

    events: loadEvents,
    select: onSelectOpenCreateModal,
    eventDrop: onUpdateEvent,
    eventResize: onUpdateEvent,
    eventClick: onEventClickOpenEditModal,
  });

  calendar.render();
}

/********************MODAL METIER********************/
export async function handleModalSubmit() {
  const st = getModalState();
  if (!st) return;

  const { title, description, startDate, endDate } = readFormBasics();

  if (!title) {
    alert("Le titre est requis.");
    return;
  }

  if (!startDate || !endDate) {
    alert("Dates/horaires invalides.");
    return;
  }

  if (endDate <= startDate) {
    alert("La fin doit être après le début.");
    return;
  }

  // Lecture des multi-selects (si users indispo => [])
  const { viewersSelectEl, editorsSelectEl } = getModalSelectEls();
  const viewUserIds = viewersSelectEl?.disabled ? [] : usersUI?.getViewSelectedIds?.() || [];
  const editUserIds = editorsSelectEl?.disabled ? [] : usersUI?.getEditSelectedIds?.() || [];

  // Priorité Viewer si présent dans les deux
  const viewSet = new Set(viewUserIds.map((x) => String(x)));
  const filteredEditUserIds = editUserIds.filter((id) => !viewSet.has(String(id)));

  const usersEnabled = !!getUsersCache() && getUsersCache().length > 0;
  setModalBusy(true, { usersEnabled });

  try {
    if (st.mode === "create") {
      const payload = {
        title,
        description,
        start: toIsoOrNull(startDate),
        end: toIsoOrNull(endDate),
        viewers: viewUserIds,           // API attend "viewers"
        editors: filteredEditUserIds,   // API attend "editors"
      };

      const created = await apiFetch(`/events`, { method: "POST", body: payload, useMetierApi: true });
      const fcEventObj = normalizeCreatedEvent(created, payload);

      //calendar.addEvent(fcEventObj);
      closeEventModal();
      refetchEvents();
      return;
    }

    // edit
    const ev = st.event;
    const backendId = ev.extendedProps.backendEventId;
    if (!backendId) {
      alert("Cet event n'a pas d'ID backend.");
      closeEventModal();
      return;
    }

    const payload = {
      title,
      description,
      start: toIsoOrNull(startDate),
      end: toIsoOrNull(endDate),
      viewers: viewUserIds,           // API attend "viewers"
      editors: filteredEditUserIds,   // API attend "editors"
    };

    const updated = await apiFetch(`/events/${backendId}`, { method: "PUT", body: payload, useMetierApi: true });

    // Applique les valeurs retournées par l'API (qui peuvent différer, ex: éditeur auto-ajouté)
    ev.setProp("title", updated.title);
    ev.setExtendedProp("description", updated.description || "");
    ev.setExtendedProp("viewUserIds", updated.viewers || []);
    ev.setExtendedProp("editUserIds", updated.editors || []);
    ev.setDates(new Date(updated.start), new Date(updated.end));

    closeEventModal();
  } catch (e) {
    console.error(e);
    const still = getModalState();
    if (still?.mode === "edit" && still?.event && still?.snapshot) {
      const ev = still.event;
      ev.setProp("title", still.snapshot.title);
      ev.setExtendedProp("description", still.snapshot.description);
      ev.setExtendedProp("viewUserIds", still.snapshot.viewUserIds);
      ev.setExtendedProp("editUserIds", still.snapshot.editUserIds);
      if (still.snapshot.start && still.snapshot.end) {
        ev.setDates(still.snapshot.start, still.snapshot.end);
      }
    }

    alert("Opération refusée par le backend.");
  } finally {
    setModalBusy(false, { usersEnabled: true });
  }
}

export async function handleModalDelete() {
  const st = getModalState();
  if (!st || st.mode !== "edit") return;

  const ev = st.event;
  const ok = confirm(`Supprimer "${ev.title}" ?`);
  if (!ok) return;

  const backendId = ev.extendedProps.backendEventId;

  setModalBusy(true, { usersEnabled: true });
  try {
    if (!backendId) {
      ev.remove();
      closeEventModal();
      return;
    }
    await apiFetch(`/events/${backendId}`, { method: "DELETE", useMetierApi: true });
    ev.remove();
    closeEventModal();
  } catch (e) {
    console.error(e);
    alert("Suppression refusée par le backend.");
  } finally {
    setModalBusy(false, { usersEnabled: true });
  }
}

export async function handleRetryUsers() {
  if (!usersUI) return;

  usersUI.showUsersLoading("Chargement des utilisateurs…");
  try {
    await loadUsers({ force: true });
    if (!getModalState()) return;
    renderUsersForCurrentModal();
  } catch (e) {
    console.error(e);
    usersUI.showUsersLoading("Erreur de chargement");
  }
}

/**********************EVENT COLORING**************************/
const EVENT_COLORS = [
  { bg: "#0b57d0", border: "#0842a0", text: "#fff" },
  { bg: "#1e8e3e", border: "#146c2e", text: "#fff" },
  { bg: "#c26401", border: "#8a4600", text: "#fff" },
  { bg: "#6f42c1", border: "#4b2a87", text: "#fff" },
  { bg: "#00838f", border: "#005b63", text: "#fff" },
  { bg: "#d93025", border: "#a50e0e", text: "#fff" },
  { bg: "#5f6368", border: "#3c4043", text: "#fff" },
  { bg: "#b80672", border: "#7a0450", text: "#fff" },
];

const colorByEventId = new Map();

function getRandomColorForId(id) {
  const key = String(id ?? "");
  if (!key) return EVENT_COLORS[0];

  if (!colorByEventId.has(key)) {
    const c = EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)];
    colorByEventId.set(key, c);
  }
  return colorByEventId.get(key);
}

function applyRandomColors(fcEventObj, idForColor) {
  const c = getRandomColorForId(idForColor);
  fcEventObj.backgroundColor = c.bg;
  fcEventObj.borderColor = c.border;
  fcEventObj.textColor = c.text;
  return fcEventObj;
}
