const appShell = document.getElementById("appShell");
const menu = document.getElementById("menu");
const frame = document.getElementById("frame");
const currentLabel = document.getElementById("currentLabel");
const createDashboard = document.getElementById("createDashboard");
const toggleSidebar = document.getElementById("toggleSidebar");

const openObjectives = document.getElementById("openObjectives");
const closeObjectives = document.getElementById("closeObjectives");
const objectivesModal = document.getElementById("objectivesModal");

let dashboards = [];
let current = null;

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

  localStorage.setItem("dashboard:selected", current.id);

  if (updateHash && location.hash.replace("#", "") !== current.id) {
    history.replaceState(null, "", `#${current.id}`);
  }
}

function buildMenu() {
  menu.innerHTML = "";

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

function bindEvents() {
  createDashboard?.addEventListener("click", (event) => {
    // Visible mais volontairement non fonctionnel (future feature)
    event.preventDefault();
    event.stopPropagation();
  });

  toggleSidebar?.addEventListener("click", () => {
    const isCollapsed = appShell.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(!isCollapsed);
  });

  openObjectives?.addEventListener("click", () => {
    openObjectivesModal();
  });

  closeObjectives?.addEventListener("click", () => {
    closeObjectivesModal();
  });

  objectivesModal?.addEventListener("click", (event) => {
    const shouldClose = event.target.closest("[data-close-modal='true']");
    if (shouldClose) {
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
    if (id) {
      setActive(id, false);
    }
  });
}

async function loadManifest() {
  const response = await fetch("./dashboards/manifest.json", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Impossible de charger le manifest (${response.status})`);
  }

  const data = await response.json();
  return data.dashboards || [];
}

function getInitialDashboardId() {
  const fromHash = location.hash ? location.hash.replace("#", "") : null;
  const fromStorage = localStorage.getItem("dashboard:selected");
  const fallback = dashboards[0]?.id || null;

  return fromHash || fromStorage || fallback;
}

function restoreSidebarState() {
  const savedSidebarState = localStorage.getItem("sidebar:collapsed");
  if (savedSidebarState === "true") {
    setSidebarCollapsed(true);
  }
}

async function init() {
  try {
    dashboards = await loadManifest();

    if (!dashboards.length) {
      currentLabel.textContent = "Aucun dashboard disponible";
      menu.innerHTML = `<div class="menu-error">Aucun dashboard trouvé dans le manifest.</div>`;
      return;
    }

    buildMenu();
    bindEvents();
    restoreSidebarState();

    const startId = getInitialDashboardId();
    setActive(startId);
  } catch (error) {
    console.error(error);
    currentLabel.textContent = "Erreur de chargement";
    menu.innerHTML = `<div class="menu-error">Impossible de charger les dashboards.</div>`;
  }
}

init();