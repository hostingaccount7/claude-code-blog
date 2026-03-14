# Claude Code Free Materials Blog (static site)

This is a **free, simple blog website** for sharing educational materials related to Claude Code—built as a lightweight static site (no backend).

## Disclaimer

**Not affiliated with Anthropic.** This independent website is **not related to**, **not endorsed by**, and **not sponsored by** Anthropic PBC.

## How to run locally

Because the blog loads post files using `fetch()`, you should use a tiny local server (opening the HTML file directly may block requests).

### Option A: Python (recommended)

```bash
python -m http.server 5173
```

Then open `http://localhost:5173/`.

### Option B: Node.js

```bash
npx serve .
```

## How to add a new post

1. Create a new file in `posts/` named like `my-post-slug.html`.
2. Add an entry to `posts/index.json`:
   - `slug` must match the filename (without `.html`)
   - `title`, `date` (ISO format), `excerpt`, and optional `tags`
3. Your post will appear on the homepage automatically.

## Images / theme assets

This project includes locally stored SVG artwork under `assets/`. See `assets/CREDITS.md` for licensing.

## Free hosting options

You can host this site for free on:
- GitHub Pages
- Cloudflare Pages
- Netlify

