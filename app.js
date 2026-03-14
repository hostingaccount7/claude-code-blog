const POSTS_INDEX_URL = "./posts/index.json";

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: #${id}`);
  return node;
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

function renderCard(post) {
  const tags = (post.tags || []).slice(0, 4);
  const tagsHtml = tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(" ");

  return `
    <a class="card" href="./post.html?post=${encodeURIComponent(post.slug)}" aria-label="Read: ${escapeHtml(
    post.title
  )}">
      <h3 class="card-title">${escapeHtml(post.title)}</h3>
      <div class="card-meta">
        <span>${escapeHtml(formatDate(post.date))}</span>
        ${tagsHtml ? `<span aria-hidden="true">•</span><span>${tagsHtml}</span>` : ""}
      </div>
      <p class="card-excerpt">${escapeHtml(post.excerpt || "")}</p>
    </a>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadPosts() {
  const res = await fetch(POSTS_INDEX_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load posts index (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("posts/index.json must be an array");
  return data;
}

function buildSearchIndex(post) {
  const parts = [post.title, post.excerpt, (post.tags || []).join(" "), post.slug];
  return normalize(parts.join(" "));
}

function sortNewestFirst(a, b) {
  const da = new Date(a.date).getTime();
  const db = new Date(b.date).getTime();
  if (!Number.isFinite(da) || !Number.isFinite(db)) return 0;
  return db - da;
}

async function main() {
  const grid = el("posts-grid");
  const meta = el("posts-meta");
  const q = el("q");

  grid.innerHTML = `<div class="muted">Loading posts…</div>`;

  let posts;
  try {
    posts = await loadPosts();
  } catch (e) {
    grid.innerHTML = `<div class="muted">Couldn’t load posts. Make sure <code>posts/index.json</code> exists.</div>`;
    meta.textContent = "";
    console.error(e);
    return;
  }

  posts.sort(sortNewestFirst);
  const indexed = posts.map((p) => ({ post: p, hay: buildSearchIndex(p) }));

  function render(list) {
    if (!list.length) {
      grid.innerHTML = `<div class="muted">No posts found. Try a different search.</div>`;
      meta.textContent = "";
      return;
    }
    grid.innerHTML = list.map((p) => renderCard(p)).join("");
    meta.textContent = `${list.length} post${list.length === 1 ? "" : "s"} shown`;
  }

  function applyFilter() {
    const term = normalize(q.value);
    if (!term) return render(posts);
    const filtered = indexed.filter((x) => x.hay.includes(term)).map((x) => x.post);
    render(filtered);
  }

  q.addEventListener("input", applyFilter);
  render(posts);
}

main();

