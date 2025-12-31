import { apiFetch } from "./api.js";

/********************API PATHS********************/
const USERS_PATH = "/users";

/********************CACHE********************/
let usersCache = null; // Array<{id,name,email}>
let usersPromise = null;

export function resetUsersCache() {
  usersCache = null;
  usersPromise = null;
}

export function getUsersCache() {
  return usersCache;
}

function extractUsersArray(maybe) {
  //marche avec [] ou {users:[]} ou {data:[]} @LEA derien
  if (Array.isArray(maybe)) return maybe;
  if (Array.isArray(maybe?.users)) return maybe.users;
  if (Array.isArray(maybe?.data)) return maybe.data;
  return null;
}

export function loadUsers({ force = false } = {}) {
  if (!force) {
    if (usersCache) return Promise.resolve(usersCache);
    if (usersPromise) return usersPromise;
  }

  usersPromise = apiFetch(USERS_PATH)
    .then((data) => {
      const arr = extractUsersArray(data) || [];
      usersCache = arr;
      return usersCache;
    })
    .catch((e) => {
      usersPromise = null;
      throw e;
    });

  return usersPromise;
}

/********************HELPERS********************/
function parseMaybeNumber(str) {
  if (typeof str !== "string") return str;
  if (/^\d+$/.test(str)) return Number(str);
  return str;
}

function getSelfId() {
  try {
    const raw = localStorage.getItem("currentUser");
    const u = raw ? JSON.parse(raw) : null;
    return u?.id ?? null;
  } catch {
    return null;
  }
}

function getSelectedIds(selectEl) {
  return Array.from(selectEl.selectedOptions).map((opt) => parseMaybeNumber(opt.value));
}

function enforceNoOverlap(primarySelect, secondarySelect) {
  const primaryIds = new Set(Array.from(primarySelect.selectedOptions).map((o) => o.value));
  Array.from(secondarySelect.selectedOptions).forEach((opt) => {
    if (primaryIds.has(opt.value)) opt.selected = false;
  });
}

/********************SELECTION USERS********************/
function setSelected(selectEl, idStr, checked) {
  const opt = Array.from(selectEl.options).find((o) => o.value === idStr);
  if (opt) opt.selected = checked;
}

function ensureCheckboxList(selectEl) {
  // on crée un conteneur juste après le <select>
  let box = selectEl.nextElementSibling;
  if (!box || !box.classList?.contains("users-checkbox-list")) {
    box = document.createElement("div");
    box.className = "users-checkbox-list";
    selectEl.insertAdjacentElement("afterend", box);
    // on masque le select (on le garde pour la logique)
    selectEl.style.display = "none";
  }
  return box;
}

function syncCheckboxesFromSelect(selectEl) {
  const box = ensureCheckboxList(selectEl);
  const selected = new Set(Array.from(selectEl.selectedOptions).map((o) => o.value));
  box.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = selected.has(cb.value);
  });
}

function renderCheckboxesForSelect(selectEl, otherSelectEl, selectedSet) {
  const box = ensureCheckboxList(selectEl);
  box.innerHTML = "";

  Array.from(selectEl.options).forEach((opt) => {
    const idStr = opt.value;

    //Pour que cliquer n'importe où selectionne (je regrette d'avoir voulu)
    const row = document.createElement("div");
    row.className = "users-checkbox-row";    

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = idStr;
    cb.checked = selectedSet.has(idStr);
    cb.disabled = selectEl.disabled;

    const text = document.createElement("span");
    text.textContent = opt.textContent;

    cb.addEventListener("change", () => {
      setSelected(selectEl, idStr, cb.checked);
      enforceNoOverlap(selectEl, otherSelectEl);

      //resync
      syncCheckboxesFromSelect(selectEl);
      syncCheckboxesFromSelect(otherSelectEl);
    });

    row.addEventListener("click", (e) => {
      if (e.target === cb) return;         // si on clique direct sur la checkbox, laisse faire
      if (cb.disabled) return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    });

    row.appendChild(cb);
    row.appendChild(text);
    box.appendChild(row);
  });
}


/*Controller UI pour centraliser les DOM users*/
export function createUsersMultiSelectUI({ viewersSelectEl, editorsSelectEl, usersLoadingHintEl }) {
  function setHintMessage(message) {
    if (!usersLoadingHintEl) return;

    const textNode = Array.from(usersLoadingHintEl.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.nodeValue = `${message} `;
    else usersLoadingHintEl.insertBefore(document.createTextNode(`${message} `), usersLoadingHintEl.firstChild);
  }

  function showUsersLoading(message = "Chargement des utilisateurs…") {
    if (usersLoadingHintEl) {
      usersLoadingHintEl.classList.remove("hidden");
      setHintMessage(message);
    }

    viewersSelectEl.innerHTML = `<option value="" disabled>${message}</option>`;
    editorsSelectEl.innerHTML = `<option value="" disabled>${message}</option>`;
    viewersSelectEl.disabled = true;
    editorsSelectEl.disabled = true;
    
  }

  function hideUsersLoading() {
    if (usersLoadingHintEl) usersLoadingHintEl.classList.add("hidden");
  }

  function renderUsersIntoMultiSelects({ selectedViewers = [], selectedEditors = [] } = {}) {
    const cache = getUsersCache();

    if (!cache) {
      showUsersLoading("Chargement des utilisateurs…");
      return;
    }

    hideUsersLoading();

    viewersSelectEl.innerHTML = "";
    editorsSelectEl.innerHTML = "";

    if (cache.length === 0) {
      viewersSelectEl.innerHTML = `<option value="" disabled>Aucun utilisateur</option>`;
      editorsSelectEl.innerHTML = `<option value="" disabled>Aucun utilisateur</option>`;
      viewersSelectEl.disabled = true;
      editorsSelectEl.disabled = true;
      return;
    }

    const viewersSelectedSet = new Set((selectedViewers || []).map((x) => String(x)));
    const editorsSelectedSet = new Set((selectedEditors || []).map((x) => String(x)));

    const selfId = getSelfId();
    const list = selfId ? cache.filter((u) => String(u.id) !== String(selfId)) : cache;


    list.forEach((u) => {
      const idStr = String(u.id);
      const label = u.name || idStr;

      const optV = document.createElement("option");
      optV.value = idStr;
      optV.textContent = label;
      optV.selected = viewersSelectedSet.has(idStr);
      viewersSelectEl.appendChild(optV);

      const optE = document.createElement("option");
      optE.value = idStr;
      optE.textContent = label;
      optE.selected = editorsSelectedSet.has(idStr);
      editorsSelectEl.appendChild(optE);
    });

    
    viewersSelectEl.disabled = false;
    editorsSelectEl.disabled = false;

    //Dédouble
    enforceNoOverlap(viewersSelectEl, editorsSelectEl);

    renderCheckboxesForSelect(viewersSelectEl, editorsSelectEl, viewersSelectedSet);
    renderCheckboxesForSelect(editorsSelectEl, viewersSelectEl, editorsSelectedSet);

    //si dédoublement a changé, jsp
    syncCheckboxesFromSelect(viewersSelectEl);
    syncCheckboxesFromSelect(editorsSelectEl);
  }

  return {
    showUsersLoading,
    hideUsersLoading,
    renderUsersIntoMultiSelects,
    enforceNoOverlap: () => enforceNoOverlap(viewersSelectEl, editorsSelectEl),
    enforceNoOverlapReverse: () => enforceNoOverlap(editorsSelectEl, viewersSelectEl),
    getViewSelectedIds: () => (viewersSelectEl.disabled ? [] : getSelectedIds(viewersSelectEl)),
    getEditSelectedIds: () => (editorsSelectEl.disabled ? [] : getSelectedIds(editorsSelectEl)),
  };
}
