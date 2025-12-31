import { apiFetch } from "./api.js";
import { getUsersCache, loadUsers } from "./users.js";
import {
  closeEventModal,
  getModalState,
  getModalSelectEls,
  openCreateModal,
  openEditModal,
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
/*back expects (title, description, start, end, viewUserIds, editUserIds)*/
function fcEventToApiPayload(fcEvent) {
  return {
    title: fcEvent.title || "",
    description: fcEvent.extendedProps.description || "",
    start: toIsoOrNull(fcEvent.start),
    end: toIsoOrNull(fcEvent.end),
    viewUserIds: fcEvent.extendedProps.viewUserIds || [],
    editUserIds: fcEvent.extendedProps.editUserIds || [],
  };
}

function apiEventToFcEvent(apiEv) {
  return {
    title: apiEv.title,
    start: apiEv.start,
    end: apiEv.end,
    extendedProps: {
      backendEventId: apiEv.eventId,
      ownerId: apiEv.ownerId,
      description: apiEv.description || "",
      viewUserIds: apiEv.viewUserIds || [],
      editUserIds: apiEv.editUserIds || [],
    },
  };
}

function normalizeCreatedEvent(apiCreated, fallbackPayload) {
  const eventId = apiCreated?.eventId ?? apiCreated?.id ?? null;

  const title = apiCreated?.title ?? fallbackPayload.title ?? "";
  const description = apiCreated?.description ?? fallbackPayload.description ?? "";
  const start = apiCreated?.start ?? fallbackPayload.start ?? null;
  const end = apiCreated?.end ?? fallbackPayload.end ?? null;
  const ownerId = apiCreated?.ownerId ?? null;
  const viewUserIds = apiCreated?.viewUserIds ?? fallbackPayload.viewUserIds ?? [];
  const editUserIds = apiCreated?.editUserIds ?? fallbackPayload.editUserIds ?? [];

  return {
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
    const start = encodeURIComponent(fetchInfo.startStr);
    const end = encodeURIComponent(fetchInfo.endStr);

    const data = await apiFetch(`/events?start=${start}&end=${end}`);
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
  const backendId = info.event.extendedProps.backendEventId;

  if (!backendId) {
    alert("Cet event n'a pas d'ID backend (création pas confirmée ?).");
    info.revert();
    return;
  }

  try {
    const payload = fcEventToApiPayload(info.event);
    await apiFetch(`/events/${backendId}`, { method: "PATCH", body: payload });
  } catch (e) {
    console.error(e);
    alert("Update refusée par le backend. Oups");
    info.revert();
  }
}

function onEventClickOpenEditModal(clickInfo) {
  clickInfo.jsEvent?.preventDefault?.();
  openEditModal(clickInfo.event);

  renderUsersForCurrentModal();
  ensureUsersReadyForModal();
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
        viewUserIds,
        editUserIds: filteredEditUserIds,
      };

      const created = await apiFetch(`/events`, { method: "POST", body: payload });
      const fcEventObj = normalizeCreatedEvent(created, payload);

      calendar.addEvent(fcEventObj);
      closeEventModal();
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
      viewUserIds,
      editUserIds: filteredEditUserIds,
    };

    await apiFetch(`/events/${backendId}`, { method: "PATCH", body: payload });

    // Applique localement après succès
    ev.setProp("title", title);
    ev.setExtendedProp("description", description);
    ev.setExtendedProp("viewUserIds", viewUserIds);
    ev.setExtendedProp("editUserIds", filteredEditUserIds);
    ev.setDates(startDate, endDate);

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
    await apiFetch(`/events/${backendId}`, { method: "DELETE" });
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