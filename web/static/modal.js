/********************MODAL********************/
// { mode: "create"|"edit", selection?:{start,end}, event?:FullCalendar.EventApi, snapshot?:{...} }
let modalState = null;

/********************DOM REFS********************/
//INJECTED
let eventModalEl = null;
let eventModalTitleEl = null;
let eventFormEl = null;

let eventTitleEl = null;
let eventDescEl = null;
let eventStartEl = null; // datetime-local
let eventEndEl = null; // datetime-local

let modalCancelBtnEl = null;
let modalSubmitBtnEl = null;
let modalDeleteBtnEl = null;

let retryUsersBtnEl = null;

let viewersSelectEl = null;
let editorsSelectEl = null;

export function initModal(refs) {
  eventModalEl = refs.eventModalEl;
  eventModalTitleEl = refs.eventModalTitleEl;
  eventFormEl = refs.eventFormEl;

  eventTitleEl = refs.eventTitleEl;
  eventDescEl = refs.eventDescEl;
  eventStartEl = refs.eventStartEl;
  eventEndEl = refs.eventEndEl;

  modalCancelBtnEl = refs.modalCancelBtnEl;
  modalSubmitBtnEl = refs.modalSubmitBtnEl;
  modalDeleteBtnEl = refs.modalDeleteBtnEl;

  retryUsersBtnEl = refs.retryUsersBtnEl;

  viewersSelectEl = refs.viewersSelectEl;
  editorsSelectEl = refs.editorsSelectEl;
}

export function getModalState() {
  return modalState;
}

export function isModalOpen() {
  return !!modalState && eventModalEl && !eventModalEl.classList.contains("hidden");
}

export function showEventModal() {
  if (!eventModalEl) return;
  eventModalEl.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

export function closeEventModal() {
  if (!eventModalEl) return;
  eventModalEl.classList.add("hidden");
  document.body.classList.remove("modal-open");
  modalState = null;
}

export function setModalBusy(isBusy, { usersEnabled = true } = {}) {
  if (!modalSubmitBtnEl) return;

  modalSubmitBtnEl.disabled = isBusy;
  if (modalCancelBtnEl) modalCancelBtnEl.disabled = isBusy;
  if (modalDeleteBtnEl) modalDeleteBtnEl.disabled = isBusy;

  if (eventTitleEl) eventTitleEl.disabled = isBusy;
  if (eventDescEl) eventDescEl.disabled = isBusy;
  if (eventStartEl) eventStartEl.disabled = isBusy;
  if (eventEndEl) eventEndEl.disabled = isBusy;
  if (retryUsersBtnEl) retryUsersBtnEl.disabled = isBusy;

  if (viewersSelectEl) viewersSelectEl.disabled = isBusy || !usersEnabled;
  if (editorsSelectEl) editorsSelectEl.disabled = isBusy || !usersEnabled;
}

/************************HELPERS*****************************/
export function toIsoOrNull(dateObj) {
  return dateObj ? dateObj.toISOString() : null;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function dateToDateTimeLocalValue(dateObj) {
  if (!dateObj) return "";
  // expect YYYY-MM-DDTHH:MM @LEA
  const y = dateObj.getFullYear();
  const m = pad2(dateObj.getMonth() + 1);
  const d = pad2(dateObj.getDate());
  const hh = pad2(dateObj.getHours());
  const mm = pad2(dateObj.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function dateTimeLocalValueToDate(value) {
  // parse "YYYY-MM-DDTHH:MM" -> Date(y, m-1, d, hh, mm) en local
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [y, m, d] = datePart.split("-").map((x) => Number(x));
  const [hh, mm] = timePart.split(":").map((x) => Number(x));
  if (![y, m, d, hh, mm].every((v) => Number.isFinite(v))) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

/************************OPEN MODES*****************************/
export function openCreateModal(selection) {
  modalState = {
    mode: "create",
    selection: { start: selection.start, end: selection.end },
  };

  eventModalTitleEl.textContent = "Créer un événement";
  modalSubmitBtnEl.textContent = "Créer";
  modalDeleteBtnEl.classList.add("hidden");

  eventFormEl.reset();

  eventStartEl.value = dateToDateTimeLocalValue(selection.start);
  eventEndEl.value = dateToDateTimeLocalValue(selection.end);

  showEventModal();
  eventTitleEl.focus();
}

export function openEditModal(fcEvent) {
  modalState = {
    mode: "edit",
    event: fcEvent,
    snapshot: {
      title: fcEvent.title || "",
      description: fcEvent.extendedProps.description || "",
      viewUserIds: fcEvent.extendedProps.viewUserIds || [],
      editUserIds: fcEvent.extendedProps.editUserIds || [],
      start: fcEvent.start ? new Date(fcEvent.start) : null,
      end: fcEvent.end ? new Date(fcEvent.end) : null,
    },
  };

  eventModalTitleEl.textContent = "Modifier un événement";
  modalSubmitBtnEl.textContent = "Enregistrer";
  modalSubmitBtnEl.classList.remove("hidden");
  modalDeleteBtnEl.classList.remove("hidden");

  eventTitleEl.value = fcEvent.title || "";
  eventDescEl.value = fcEvent.extendedProps.description || "";

  eventStartEl.value = dateToDateTimeLocalValue(fcEvent.start);
  eventEndEl.value = dateToDateTimeLocalValue(fcEvent.end);

  // Activer les champs pour l'édition
  setFieldsReadOnly(false);

  showEventModal();
  eventTitleEl.focus();
}

export function openViewModal(fcEvent) {
  modalState = {
    mode: "view",
    event: fcEvent,
    snapshot: {
      title: fcEvent.title || "",
      description: fcEvent.extendedProps.description || "",
      viewUserIds: fcEvent.extendedProps.viewUserIds || [],
      editUserIds: fcEvent.extendedProps.editUserIds || [],
      start: fcEvent.start ? new Date(fcEvent.start) : null,
      end: fcEvent.end ? new Date(fcEvent.end) : null,
    },
  };

  eventModalTitleEl.textContent = "Détails de l'événement";
  modalSubmitBtnEl.classList.add("hidden");
  modalDeleteBtnEl.classList.add("hidden");

  eventTitleEl.value = fcEvent.title || "";
  eventDescEl.value = fcEvent.extendedProps.description || "";

  eventStartEl.value = dateToDateTimeLocalValue(fcEvent.start);
  eventEndEl.value = dateToDateTimeLocalValue(fcEvent.end);

  // Désactiver les champs en lecture seule
  setFieldsReadOnly(true);

  showEventModal();
}

function setFieldsReadOnly(readOnly) {
  if (eventTitleEl) eventTitleEl.disabled = readOnly;
  if (eventDescEl) eventDescEl.disabled = readOnly;
  if (eventStartEl) eventStartEl.disabled = readOnly;
  if (eventEndEl) eventEndEl.disabled = readOnly;
  if (viewersSelectEl) viewersSelectEl.disabled = readOnly;
  if (editorsSelectEl) editorsSelectEl.disabled = readOnly;
}

/************************READ FORM*****************************/
export function readFormBasics() {
  const title = (eventTitleEl.value || "").trim();
  const description = eventDescEl.value || "";

  const startDate = dateTimeLocalValueToDate(eventStartEl.value);
  const endDate = dateTimeLocalValueToDate(eventEndEl.value);

  return { title, description, startDate, endDate };
}

export function getModalSelectEls() {
  return { viewersSelectEl, editorsSelectEl };
}