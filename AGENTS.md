# Rules for AI agents working in this app

This repo builds ONE community's public Site as a fully STATIC Astro site:
`/`, `/<page>/`, `/blog/`, `/blog/post/?slug=<slug>` and `dist/404.html` for
any address with no page. Every other path on the hostname (`/login`, `/join`,
`/feeds`, `/dashboard`, `/api`, `/_next`, `/robots.txt`, `/sitemap.xml`…) is
served by the EzyCommunity App and never reaches this site — link to it with a
plain `<a href>`.

- Keep it static: NO adapter (`@astrojs/cloudflare` makes it SSR — that is the
  other template; `@astrojs/node|vercel|netlify` are refused outright), no
  `output: 'server'`, no `export const prerender = false`. `astro` must stay a
  dependency — it is how the platform recognises the project. npm only: keep
  `package-lock.json` committed and no other lockfile.
- Never create pages under an App path (`src/pages/api/`, `src/pages/login.astro`…)
  or `robots.txt` / `sitemap.xml` (as a page or in `public/`) — the App owns
  those URLs and visitors never see them.
- The build has NO access to the community (no URL, no API). ALL data is
  fetched in the BROWSER by `src/scripts/site.ts`, from the SAME origin
  (`/api/public/...`). Never fetch in page frontmatter, never call another
  host — only the community's own origin has the API, without CORS.
- Dynamic routes (`[slug].astro`) cannot work without a server: a post is ONE
  page, `src/pages/blog/post.astro`, reading `?slug=`.
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
