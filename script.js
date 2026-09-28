const OWNER = "AntonGansch";
const REPO = "AJP";
const FOLDER = "Apps_und_Games";

const API =
  "https://api.github.com/repos/" +
  OWNER +
  "/" +
  REPO +
  "/contents/" +
  FOLDER +
  "?ref=main";

let projects = [];
let filter = "all";

const $ = (id) => document.getElementById(id);

const cleanName = (name) =>
  name
    .replace(/\.exe$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function classify(name) {
  const n = name.toLowerCase();

  if (/game|spiel|dino|warb|pong|snake|tetris/.test(n)) {
    return "game";
  }

  return "app";
}

async function loadProjects() {
  $("status").textContent = "🔎 Suche nach neuen Dateien auf GitHub…";
  $("status").className = "status";

  try {
    const res = await fetch(API, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!res.ok) {
      throw new Error("GitHub API: " + res.status);
    }

    const files = await res.json();

    const exes = files.filter(
      (f) => f.type === "file" && /\.exe$/i.test(f.name)
    );

    let meta = {};

    try {
      const mr = await fetch("apps.json?cb=" + Date.now());

      if (mr.ok) {
        meta = await mr.json();
      }
    } catch {}

    projects = exes.map((f) => {
      const m = meta[f.name.toLowerCase()] || meta[f.name] || {};

      return {
        name: m.name || cleanName(f.name),
        file: f.name,
        url: f.download_url,
        type: m.type || classify(f.name),
        description:
          m.description || "AJP Projekt – weitere Informationen folgen.",
        version: m.version || "—",
        image: m.image || ""
      };
    });

    render();

    $("last-updated").textContent =
      "Zuletzt aktualisiert: " +
      new Date().toLocaleTimeString("de-AT");
  } catch (err) {
    $("status").textContent =
      "⚠️ Die GitHub-Dateien konnten gerade nicht geladen werden.";
    $("status").className = "status error";
    console.error(err);
  }
}

function render() {
  const q = $("search").value.trim().toLowerCase();

  const shown = projects.filter(
    (p) =>
      (filter === "all" || p.type === filter) &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q))
  );

  $("count").textContent = shown.length;

  $("section-title").textContent =
    filter === "game"
      ? "🎮 Spiele"
      : filter === "app"
      ? "💻 Apps"
      : "Alle Projekte";

  $("status").textContent = projects.length
    ? projects.length +
      " Programm" +
      (projects.length === 1 ? "" : "e") +
      " aus GitHub gefunden."
    : "Noch keine .exe-Dateien vorhanden – bald kommt hier mehr! 🚀";

  $("cards").innerHTML = shown.length
    ? shown.map(card).join("")
    : '<div class="empty">Keine passenden Projekte gefunden.</div>';
}

function card(p) {
  const icon = p.type === "game" ? "🎮" : "💻";

  const image = p.image
    ? '<img src="' + escapeHtml(p.image) + '" alt="">'
    : icon;

  return `
    <article class="card">
      <div class="thumb">
        ${image}
        <span class="tag">
          ${icon} ${p.type === "game" ? "SPIEL" : "APP"}
        </span>
      </div>

      <div class="card-body">
        <h3>${escapeHtml(p.name)}</h3>

        <div class="description">
          ${escapeHtml(p.description)}
        </div>

        <div class="meta">
          <span>⭐ AJP</span>
          <span>v${escapeHtml(p.version)}</span>
        </div>

        <a class="download" href="${escapeAttr(p.url)}" download>
          ⬇️ Download .exe
        </a>
      </div>
    </article>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-btn")
      .forEach((x) => x.classList.remove("active"));

    button.classList.add("active");
    filter = button.dataset.filter;
    render();
  });
});

$("search").addEventListener("input", render);
$("refresh").addEventListener("click", loadProjects);

loadProjects();
