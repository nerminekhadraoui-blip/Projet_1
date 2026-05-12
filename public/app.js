const appShell = document.getElementById("appShell");
const menu = document.getElementById("menu");
const frame = document.getElementById("frame");
const currentLabel = document.getElementById("currentLabel");
const pageKicker = document.getElementById("pageKicker");
const serviceTitle = document.getElementById("serviceTitle");
const createDashboard = document.getElementById("createDashboard");
const toggleSidebar = document.getElementById("toggleSidebar");

const openObjectives = document.getElementById("openObjectives");
const closeObjectives = document.getElementById("closeObjectives");
const objectivesModal = document.getElementById("objectivesModal");

let dashboards = [];
let current = null;
let serviceKey = null;
let serviceInfo = null;

/* ---------- SIDEBAR ---------- */

function setSidebarCollapsed(collapsed) {
  if (!appShell) return;
  appShell.classList.toggle("sidebar-collapsed", collapsed);
  localStorage.setItem("sidebar:collapsed", String(collapsed));
}

function updateActiveMenuItem(id) {
  [...menu.querySelectorAll(".menu-item")].forEach((item) => {
    item.classList.toggle("active", item.dataset.id === id);
  });
}

/* ---------- DASHBOARDS ---------- */

function setActive(id, updateHash = true) {
  current = dashboards.find((d) => d.id === id) || dashboards[0];

  if (!current) {
    frame.removeAttribute("src");
    currentLabel.textContent = "Aucun dashboard";
    return;
  }

  frame.src = current.file;
  currentLabel.textContent = current.label;
  updateActiveMenuItem(current.id);

  localStorage.setItem(`dashboard:selected:${serviceKey}`, current.id);

  if (updateHash && location.hash.replace("#", "") !== current.id) {
    history.replaceState(null, "", `#${current.id}`);
  }
}

function buildMenu() {
  menu.innerHTML = "";

  if (!dashboards.length) {
    menu.innerHTML = `<div class="menu-error">Aucun tableau de bord pour le moment.</div>`;
    return;
  }

  dashboards.forEach((dashboard) => {
    const link = document.createElement("a");
    link.href = `#${dashboard.id}`;
    link.textContent = dashboard.label;
    link.dataset.id = dashboard.id;
    link.className = "menu-item";

    link.addEventListener("click", (event) => {
      event.preventDefault();
      setActive(dashboard.id);
    });

    menu.appendChild(link);
  });
}

/* ---------- MODAL OBJECTIFS ---------- */

function openObjectivesModal() {
  if (!objectivesModal) return;
  objectivesModal.classList.remove("hidden");
  objectivesModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeObjectivesModal() {
  if (!objectivesModal) return;
  objectivesModal.classList.add("hidden");
  objectivesModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* ---------- EVENTS ---------- */

function bindEvents() {
  createDashboard?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  toggleSidebar?.addEventListener("click", () => {
    const isCollapsed = appShell.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(!isCollapsed);
  });

  openObjectives?.addEventListener("click", () => openObjectivesModal());
  closeObjectives?.addEventListener("click", () => closeObjectivesModal());

  objectivesModal?.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal='true']")) {
      closeObjectivesModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && objectivesModal && !objectivesModal.classList.contains("hidden")) {
      closeObjectivesModal();
    }
  });

  window.addEventListener("hashchange", () => {
    const id = location.hash.replace("#", "");
    if (id) setActive(id, false);
  });
}

/* ---------- MANIFEST ---------- */

async function loadManifest() {
  const response = await fetch("./dashboards/manifest.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Impossible de charger le manifest (${response.status})`);
  }
  return response.json();
}

/* ---------- SERVICE ---------- */

function getServiceKey() {
  const params = new URLSearchParams(location.search);
  return params.get("service");
}

function applyServiceUI() {
  if (!serviceInfo) return;

  // Titre de section dans la sidebar : icône + nom du service
  if (serviceTitle) {
    const icon = serviceInfo.icon || "📊";
    const label = serviceInfo.label || "Service";
    serviceTitle.textContent = `${icon}  ${label}`;
  }

  // Kicker dans la topbar
  if (pageKicker) pageKicker.textContent = (serviceInfo.label || "Dashboard").toUpperCase();

  // Titre de l'onglet
  document.title = `${serviceInfo.label} — Dashboards BestCall x Wengo`;
}

/* ---------- INIT ---------- */

function getInitialDashboardId() {
  const fromHash = location.hash ? location.hash.replace("#", "") : null;
  const fromStorage = localStorage.getItem(`dashboard:selected:${serviceKey}`);
  const fallback = dashboards[0]?.id || null;
  return fromHash || fromStorage || fallback;
}

function restoreSidebarState() {
  const saved = localStorage.getItem("sidebar:collapsed");
  if (saved === "true") setSidebarCollapsed(true);
}

async function init() {
  try {
    serviceKey = getServiceKey();

    // Pas de service dans l'URL → on retourne à la landing
    if (!serviceKey) {
      window.location.replace("index.html");
      return;
    }

    const manifest = await loadManifest();
    const services = manifest.services || {};
    serviceInfo = services[serviceKey];

    // Service inconnu → on retourne à la landing
    if (!serviceInfo) {
      window.location.replace("index.html");
      return;
    }

    applyServiceUI();
    dashboards = serviceInfo.dashboards || [];

    buildMenu();
    bindEvents();
    restoreSidebarState();

    if (!dashboards.length) {
      currentLabel.textContent = "Aucun dashboard disponible";
      frame.removeAttribute("src");
      return;
    }

    const startId = getInitialDashboardId();
    setActive(startId);
  } catch (error) {
    console.error(error);
    currentLabel.textContent = "Erreur de chargement";
    menu.innerHTML = `<div class="menu-error">Impossible de charger les dashboards.</div>`;
  }
}

init();