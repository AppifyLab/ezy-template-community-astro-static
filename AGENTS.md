# Rules for AI agents working in this app

This repo builds ONE community's public Site as a fully STATIC Astro site:
`/`, `/<page>/`, `/blog/`, `/blog/post/?slug=<slug>` and `dist/404.html` for
any address with no page. Every other path on the hostname (`/login`, `/join`,
`/feeds`, `/dashboard`, `/api`, `/_next`, `/robots.txt`, `/sitemap.xml`…) is
served by the EzyCommunity App and never reaches this site — link to it with a
plain `<a href>`.

- Keep it static: NO adapter (`@astrojs/cloudflare` is the Astro SSR
  Template's setup; `@astrojs/node|vercel|netlify` are refused outright), no
  `output: 'server'`, no `export const prerender = false`. `astro` must stay a
  dependency — it is how the platform recognises the project.
- This Template uses npm: keep `package-lock.json` committed (the Build then
  runs `npm ci`) and add no second lockfile. That is the Template's choice —
  the platform picks npm, pnpm or yarn from the lockfile, and refuses bun.
- Never create pages under an App path (`src/pages/api/`, `src/pages/login.astro`…)
  or `robots.txt` / `sitemap.xml` (as a page or in `public/`) — the App owns
  those URLs and visitors never see them.
- ALL data is fetched in the BROWSER by `src/scripts/site.ts`, from the SAME
  origin (`/api/public/...`), so every visit shows current data. Never fetch in
  page frontmatter: in a static build it runs once, during the Build, which is
  given no site URL — and whatever it fetched stays frozen in the HTML until
  the next Build. Never call another host: the API lives only on the
  community's own origin and sends no CORS headers to other sites.
- A post is ONE page, `src/pages/blog/post.astro`, reading `?slug=` in the
  browser, so a new post shows without a new Build. `[slug].astro` with
  `getStaticPaths` would fix the post list at Build time and miss every post
  published after it.
- The API is `/api/public/site/v1/initial-data` (name, logo, favicon — no
  description, no colours; don't invent fields), `/api/public/blog/post/all-posts?page=&per_page=`
  (`per_page`, not `limit`; envelope `{data: {meta, data: [...]}}`) and
  `/api/public/blog/post/<slug>/read`.
- Write API data with `textContent` / attributes. The ONLY `innerHTML` is the
  post body (rich text from the community's own blog editor, rendered the same
  way the platform's blog renders it).
- Show authors by name only; never render or store an email address.
- Do not add a `base` or asset prefix: the site is served at `/` on its own
  origin, and `404.html` is served at arbitrary depths.
- No `.github/workflows/` — the site deploys from the platform, not Actions.

## Platform rules

True for any code on an EzyCommunity Site, not only this Template:

- **What is built is detected from the files, and the verdict is final:**
  TanStack Start (`@tanstack/react-start`), Astro (static, or SSR with
  `@astrojs/cloudflare` only), or a root `index.html` published as-is.
  Next.js, Nuxt, SvelteKit, Remix, React Router (framework mode), Gatsby,
  Angular and un-built Vite / CRA / Eleventy source are refused. The project
  sits at the repository root (a zip may wrap it in one folder); a Node project
  has one lockfile (npm, pnpm or yarn; bun is refused). Server code runs on
  Cloudflare Workers (`nodejs_compat`), not Node.
- **The App owns** `/api`, `/login`, `/join`, `/feeds`, `/dashboard`,
  `/settings`, `/_next`, `/robots.txt`, `/sitemap.xml`,
  `/<product>/<id>/checkout` and more: a file or route there is never served
  (the dashboard lists it as a shadowed path). Link to App pages with a plain
  `<a href>`.
- **Community data comes only from its public API on its own hostname**
  (`/api/public/...`): server code builds the URL from `EZY_SITE_URL` (a plain
  variable, not a secret), browser code uses relative URLs. Deployed server
  code reaches only that hostname and its Site Database. Data fetched during
  the Build is frozen until the next Build (a Redeploy reuses the old output)
  — fetch at request time or in the browser.
- **This site is frontend-only: no secret ever reaches it.** It has no server
  code, so the platform's Worker secrets (`DATABASE_URL`, `EZY_COMMUNITY_KEY`)
  are never given to it, and everything in it is served to the browser: never
  put a key, token or password in code, `.env` or config, never ask the owner
  for one. Never send a member's email address to the browser.
- **No backend here.** A Site API (`/site-api/*`) and a Site Database need
  server code: start from the Astro app Template
  (`AppifyLab/ezy-template-community-astro-app`) instead.
- **No deploy config.** Don't commit `wrangler.*`: the platform writes the
  Worker config and drops any KV, R2, D1 or other binding.
