const POSTS_INDEX_URL = "./posts/index.json";

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: #${id}`);
  return node;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function getSlug() {
  const url = new URL(window.location.href);
  return (url.searchParams.get("post") || "").trim();
}

async function loadIndex() {
  const res = await fetch(POSTS_INDEX_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load posts index (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("posts/index.json must be an array");
  return data;
}

async function loadPostHtml(slug) {
  const res = await fetch(`./posts/${encodeURIComponent(slug)}.html`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load post "${slug}" (${res.status})`);
  return await res.text();
}

function renderMeta(post) {
  const tags = (post.tags || []).slice(0, 10).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(" ");
  return `
    <span>${escapeHtml(formatDate(post.date))}</span>
    <span>${escapeHtml(post.readingTime || "Quick read")}</span>
    ${post.category ? `<span>cat: ${escapeHtml(post.category)}</span>` : ""}
    ${tags ? `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">${tags}</div>` : ""}
  `;
}

async function main() {
  const slug = getSlug();
  const titleEl = el("post-title");
  const metaEl = el("post-meta");
  const contentEl = el("post-content");

  if (!slug) {
    titleEl.textContent = "Missing post";
    metaEl.innerHTML = "";
    contentEl.innerHTML = `<p class="muted">No post selected. Go back to <a href="./index.html#posts">the posts list</a>.</p>`;
    document.title = "Missing post • Claude Code Free Materials Blog";
    return;
  }

  let posts;
  try {
    posts = await loadIndex();
  } catch (e) {
    titleEl.textContent = "Error";
    contentEl.innerHTML = `<p class="muted">Couldn’t load posts index.</p>`;
    console.error(e);
    return;
  }

  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    titleEl.textContent = "Post not found";
    metaEl.innerHTML = "";
    contentEl.innerHTML = `<p class="muted">That post doesn’t exist. Go back to <a href="./index.html#posts">the posts list</a>.</p>`;
    document.title = "Not found • Claude Code Free Materials Blog";
    return;
  }

  titleEl.textContent = post.title;
  metaEl.innerHTML = renderMeta(post);
  document.title = `${post.title} • Claude Code Free Materials Blog`;

  // Update meta description with post excerpt for GA and social sharing
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta && post.excerpt) descMeta.setAttribute("content", post.excerpt);

  // Canonical URL
  const canonicalUrl = `https://claudecodefree.com/post.html?post=${encodeURIComponent(slug)}`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  // Open Graph + Twitter Card tags
  const ogTags = [
    ["og:type",        "article"],
    ["og:site_name",   "Claude Code Free Materials Blog"],
    ["og:title",       post.title],
    ["og:description", post.excerpt || ""],
    ["og:url",         canonicalUrl],
    ["twitter:card",        "summary"],
    ["twitter:title",       post.title],
    ["twitter:description", post.excerpt || ""],
  ];
  for (const [prop, content] of ogTags) {
    const attr = prop.startsWith("twitter:") ? "name" : "property";
    let tag = document.querySelector(`meta[${attr}="${prop}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, prop);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  }

  // JSON-LD structured data (BlogPosting)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || "",
    "datePublished": post.date,
    "url": canonicalUrl,
    "publisher": {
      "@type": "Organization",
      "name": "Claude Code Free Materials Blog",
      "url": "https://claudecodefree.com"
    }
  };
  let ldScript = document.getElementById("ld-json");
  if (!ldScript) {
    ldScript = document.createElement("script");
    ldScript.id = "ld-json";
    ldScript.type = "application/ld+json";
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(jsonLd);

  // Re-fire page_view so GA records the real post title, not the loading-state title
  if (typeof gtag === "function") {
    gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  try {
    const html = await loadPostHtml(slug);
    contentEl.innerHTML = html;
  } catch (e) {
    contentEl.innerHTML = `<p class="muted">Couldn’t load this post’s content file (<code>posts/${escapeHtml(
      slug
    )}.html</code>).</p>`;
    console.error(e);
  }
}

main();

