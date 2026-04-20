const POSTS_INDEX_URL = "./posts/index.json";

const CATEGORIES = [
  { id: "all",      label: "all",              match: () => true },
  { id: "context",  label: "save-context",     match: p => p.category === "context" },
  { id: "start",    label: "getting-started",  match: p => p.category === "start" },
  { id: "skills",   label: "core-skills",      match: p => p.category === "skills" },
  { id: "projects", label: "projects",         match: p => p.category === "projects" },
  { id: "workflow", label: "workflow",         match: p => p.category === "workflow" },
  { id: "students", label: "students",         match: p => p.category === "students" },
];

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: #${id}`);
  return node;
}

function normalize(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch { return iso; }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCard(post, num, featured) {
  const numStr = String(num).padStart(2, "0");
  const primaryTag = post.tags && post.tags[0] ? post.tags[0] : null;
  const cls = `card${featured ? " card--featured" : ""}`;

  return `
    <a class="${cls}" href="./post.html?post=${encodeURIComponent(post.slug)}" aria-label="Read: ${escapeHtml(post.title)}">
      <div class="card-left">
        <div class="card-eyebrow">
          <span class="card-num">[${numStr}]</span>
          ${primaryTag ? `<span class="tag">${escapeHtml(primaryTag)}</span>` : ""}
        </div>
        <h3 class="card-title">${escapeHtml(post.title)}</h3>
        <div class="card-meta">
          <span>${escapeHtml(formatDate(post.date))}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(post.readingTime || "Quick read")}</span>
        </div>
      </div>
      ${featured ? `<p class="card-excerpt">${escapeHtml(post.excerpt || "")}</p>` : ""}
    </a>
  `;
}

async function loadPosts() {
  const res = await fetch(POSTS_INDEX_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load posts index (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("posts/index.json must be an array");
  return data;
}

function buildSearchIndex(post) {
  const parts = [post.title, post.excerpt, (post.tags || []).join(" "), post.slug, post.category || ""];
  return normalize(parts.join(" "));
}

function sortNewestFirst(a, b) {
  const da = new Date(a.date).getTime();
  const db = new Date(b.date).getTime();
  if (!Number.isFinite(da) || !Number.isFinite(db)) return 0;
  return db - da;
}

async function main() {
  const grid   = el("posts-grid");
  const meta   = el("posts-meta");
  const q      = el("q");

  grid.innerHTML = `<div class="muted">Loading posts…</div>`;

  let posts;
  try {
    posts = await loadPosts();
  } catch (e) {
    grid.innerHTML = `<div class="muted">Couldn't load posts. Make sure <code>posts/index.json</code> exists.</div>`;
    meta.textContent = "error";
    console.error(e);
    return;
  }

  posts.sort(sortNewestFirst);

  const indexed = posts.map((p, i) => ({
    post: p,
    hay: buildSearchIndex(p),
    num: i + 1,
  }));

  // ── Category buttons ────────────────────────────────────────────
  const catBtns = document.querySelectorAll(".cat-btn");

  // Add post counts to each button
  catBtns.forEach(btn => {
    const id  = btn.dataset.cat;
    const cat = CATEGORIES.find(c => c.id === id);
    if (!cat) return;
    const count = posts.filter(cat.match).length;
    const countEl = document.createElement("span");
    countEl.className = "cat-count";
    countEl.textContent = `×${count}`;
    btn.appendChild(countEl);
  });

  let activeCat = "all";

  function setCategory(id, scroll) {
    activeCat = id;
    catBtns.forEach(b => b.classList.toggle("active", b.dataset.cat === id));
    // Update URL hash without scrolling
    const hash = id === "all" ? "" : "#" + id;
    history.replaceState(null, "", window.location.pathname + window.location.search + hash);
    applyFilter();
    if (scroll) {
      const postsEl = document.getElementById("posts");
      if (postsEl) postsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  catBtns.forEach(btn => {
    btn.addEventListener("click", () => setCategory(btn.dataset.cat, true));
  });

  // ── Render ──────────────────────────────────────────────────────
  function render(list) {
    if (!list.length) {
      grid.innerHTML = `<div class="muted">No posts found. Try a different search or category.</div>`;
      meta.textContent = "ls: 0 entries";
      return;
    }
    grid.innerHTML = list.map((item, i) => renderCard(item.post, item.num, i === 0)).join("");
    const catLabel = activeCat === "all" ? "" : ` [${activeCat}]`;
    meta.textContent = `ls${catLabel}: ${list.length} entr${list.length === 1 ? "y" : "ies"}`;
  }

  // ── Search + category combined filter ───────────────────────────
  let searchTimer;
  let searchScrolled = false;
  function applyFilter() {
    const term = normalize(q.value);
    const cat  = CATEGORIES.find(c => c.id === activeCat);
    let filtered = indexed.filter(x => cat.match(x.post));
    if (term) filtered = filtered.filter(x => x.hay.includes(term));
    render(filtered);

    if (term) {
      if (!searchScrolled) {
        searchScrolled = true;
        const postsEl = document.getElementById("posts");
        if (postsEl) postsEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        if (typeof gtag === "function") gtag("event", "search", { search_term: term });
      }, 800);
    } else {
      searchScrolled = false;
    }
  }

  q.addEventListener("input", applyFilter);

  // ── Init from URL hash ──────────────────────────────────────────
  const initHash = window.location.hash.slice(1);
  const initCat  = CATEGORIES.find(c => c.id === initHash) ? initHash : "all";
  setCategory(initCat, false);

  // Keep hash in sync if user navigates back/forward
  window.addEventListener("popstate", () => {
    const h = window.location.hash.slice(1);
    const c = CATEGORIES.find(c => c.id === h) ? h : "all";
    setCategory(c, false);
  });
}

main();
