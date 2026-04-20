# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

The site uses `fetch()` to load posts, so it must be served over HTTP—opening HTML files directly won't work.

```bash
# Python (recommended)
python -m http.server 8080

# Node.js
npx serve .
```

Then open `http://localhost:8080/`.

There is no build step, no bundler, no npm install, and no test suite. All files are plain static assets.

## How the blog works

Posts are decoupled into two parts:

- **`posts/index.json`** — metadata array (slug, title, date, readingTime, excerpt, tags, category). This is the source of truth for the home page card grid and post page header.
- **`posts/<slug>.html`** — the post body, an HTML fragment with no `<html>`/`<head>` wrapper. Injected verbatim into the page via `innerHTML`.

`app.js` fetches `index.json`, sorts posts newest-first, renders cards, handles live search (title + excerpt + tags + slug), and category filtering.
`post.js` reads `?post=<slug>` from the URL, looks up the post in `index.json`, fetches `posts/<slug>.html`, and dynamically injects SEO meta tags (canonical, OG, Twitter Card, JSON-LD).

Both JS files use `cache: "no-store"` on every fetch so changes appear immediately without a hard refresh.

## Adding a post

1. Create `posts/<slug>.html` — semantic HTML fragment only (`<h2>`, `<p>`, `<ul>`, `<pre><code>`, `<blockquote>`, etc.).
2. Add an entry to `posts/index.json` with `slug`, `title`, `date` (ISO 8601), `readingTime`, `excerpt`, `tags`, and `category`.
3. The slug in JSON must exactly match the filename (without `.html`).
4. Update the post count in `index.html` hero section if adding a new post.
5. Add the post URL to `sitemap.xml`.

Internal links inside post HTML use `./post.html?post=<slug>` (no `.html` in the query param).

## Categories

Posts have a `category` field in `index.json`. Valid values:

| id         | label           | notes                          |
|------------|-----------------|--------------------------------|
| `context`  | save-context    | **Featured** — shown first, filled accent pill |
| `start`    | getting-started |                                |
| `skills`   | core-skills     |                                |
| `projects` | projects        |                                |
| `workflow` | workflow        |                                |
| `students` | students        |                                |

The category filter bar on the home page uses these IDs. URL hash routing: `/#workflow` filters to workflow posts.

## Key conventions

- **No Markdown** — posts are plain HTML fragments, not Markdown.
- **XSS safety** — `app.js` and `post.js` use `escapeHtml()` for all metadata fields rendered into cards and headers. Post body HTML is injected raw (trusted content only — never render user input this way).
- **Tags** — home page cards show the first tag; post page header displays up to 10.
- **Dates** — store as ISO 8601 (`YYYY-MM-DD`); `formatDate()` localises for display.

## Design system

- **Theme**: Dark phosphor terminal (Deep Signal / BG3 Scan Field)
- **Font**: Space Mono (Google Fonts) — monospace throughout
- **Accent**: `#4dffaa` (phosphor green)
- **Background**: Fixed `body::before` nebula + `body::after` stars; `.scanlines` div with CRT repeating gradient
- **Layout**: Both `.site-header` and `.cat-bar` are `position: fixed`. Content on the index page uses `margin-top: var(--offset)` (header + cat-bar height). Post pages use `margin-top: var(--header-h)`.
- **CSS variables**: `--header-h: 65px`, `--catbar-h: 42px`, `--offset: calc(var(--header-h) + var(--catbar-h))`
- **Post banner**: Pure CSS radial gradient (no image) with CRT scanline `::after`

## SEO

- `sitemap.xml` — all post URLs, update `lastmod` when editing a post
- `robots.txt` — references sitemap
- `post.js` — dynamically sets `<title>`, `meta description`, canonical, OG tags, Twitter Card, and JSON-LD `BlogPosting` schema per post
- Google Analytics 4: Measurement ID `G-MMZSHMHL1R`

## Disclaimer

Not affiliated with Anthropic PBC. Do not imply endorsement or sponsorship in any content added to this site.
