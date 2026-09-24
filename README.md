# Community site — Astro (static)

A starter for your community's **public website**, built with
[Astro](https://astro.build) as a fully static site: `npm run build` turns
`src/pages/` into plain HTML files, and those files are what visitors get.

## Put it live

Make your own copy first — this repository is a template, you never edit it
directly:

- **Upload a zip** — download this template as a zip, change what you like and
  upload the zip (the project folder, not `dist/`) on the **Custom code** page
  of your EzyCommunity dashboard. Every new upload replaces the live site.
- **Or connect GitHub** — click **Use this template** on GitHub to copy it into
  your own account, then pick that repository and a branch on the dashboard.
  Every push to that branch redeploys your site.

The platform sees `astro` in `package.json`, installs with `npm ci` (so keep
`package-lock.json` committed), runs `npm run build` and publishes `dist/`.

## What this site controls — and what it doesn't

Your community lives on one address (for example
`https://intel.ezycommunity.com`). Two things serve it, and the split is fixed:

| Address                   | Served by        |
| ------------------------- | ---------------- |
| `/` (home)                | **this site**    |
| any page slug             | **this site**    |
| `/blog/`, `/blog/post/`   | **this site**    |
| `/login`, `/join`         | EzyCommunity     |
| `/feeds`, `/dashboard`    | EzyCommunity     |
| `/api`, other app paths   | EzyCommunity     |

So your public, marketing pages live here; the community product itself
(sign-up, log in, the feed, courses, events, settings) is run by EzyCommunity.
Link to it with ordinary links (`<a href="/feeds">`), as these pages do. A page
you add under an app path (say `src/pages/login.astro`, or `public/robots.txt`)
is never reached by visitors — the dashboard lists any it finds.

## Your content comes from your community

Nothing is hard-coded. The site is built once, so your **live** data is read in
the visitor's browser by `src/scripts/site.ts`, from your site's own address:

- your name, logo and favicon (`/api/public/site/v1/initial-data`)
- your published blog posts (`/api/public/blog/post/...`)

Edit a post in your dashboard and it shows here on the next visit — no
redeploy needed.

A static site cannot have one page per post, so a post lives at
`/blog/post/?slug=<post>`. Want `/blog/<post>` addresses, or pages rendered on
the server? Use the **Astro SSR** template instead.

## Running it on your machine

```bash
cp .env.example .env     # then set EZY_SITE_URL to your community's address
npm install
npm run dev              # http://localhost:4321
```

`npm run dev` passes `/api` through to `EZY_SITE_URL`, so the pages show your
real brand and posts. The deployed site needs no settings.

```bash
npm run build            # the static site, into dist/
```

## Where things are

```
src/
  pages/
    index.astro        the home page
    blog/index.astro   /blog/ — the blog list (?page=2 for older posts)
    blog/post.astro    /blog/post/?slug=<post> — one blog post
    404.astro          any address that has no page (built to dist/404.html)
  layouts/Base.astro   header, footer, <head> — wraps every page
  scripts/site.ts      fetches your brand and posts and fills the pages
  scripts/format.ts    dates, excerpts, initials
  styles/global.css    all the styling, plain CSS
```

Add a page by adding a file to `src/pages/`: `src/pages/team.astro` becomes
`/team/`.

## Getting help

Broke something? Every deploy is kept, so you can redeploy an earlier one from
your dashboard while you fix it.
