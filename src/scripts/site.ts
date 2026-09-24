/**
 * The browser half of the site: it reads your community's live data and puts it
 * on the page. Astro builds the pages to plain HTML ONCE, at build time, and the
 * build has no access to your community — so the brand and the posts are
 * fetched here, on every visit. Every page says which one it is with
 * <body data-page="home|blog|post|404">.
 *
 * WHERE THE DATA COMES FROM
 * The site is served on your community's own address, next to your community
 * app, so the browser reads the PUBLIC API from the same origin (no keys, no
 * CORS). `npm run dev` proxies /api to EZY_SITE_URL (astro.config.mjs).
 *
 * SAFETY
 * Everything from the API is written with textContent / attributes, never as
 * HTML — except a post's body, which is rich text your own blog admins wrote in
 * the community editor, rendered exactly as the community's own blog page does.
 */
import {formatDate, initials, preview, readingMinutes} from './format';

interface Site {
  name?: string | null;
  logo?: string | null;
  favIcon?: string | null;
}

interface Author {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatar?: string | null;
}

interface Term {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  authors?: Author[];
  categories?: Term[];
  tags?: Term[];
}

interface PostsPage {
  data?: Post[];
  meta?: {lastPage?: number};
}

const API = '/api/public';
const page = document.body.dataset.page ?? '';

/* -------------------------------------------------------------------- data */

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {headers: {accept: 'application/json'}});
    if (!res.ok) return null;
    const body = (await res.json()) as {data?: T};
    return body?.data ?? null;
  } catch {
    return null;
  }
}

function authorName(author: Author): string {
  return (
    author.displayName?.trim() ||
    [author.firstName, author.lastName].filter(Boolean).join(' ').trim() ||
    'Unknown author'
  );
}

/* ----------------------------------------------------------------- helpers */

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

const postUrl = (slug: string) => `/blog/post/?slug=${encodeURIComponent(slug)}`;

function setTitle(pageName: string, siteName: string | null | undefined): void {
  if (!siteName) return;
  document.title = pageName ? `${pageName} · ${siteName}` : siteName;
}

/* ------------------------------------------------------------------- brand */

function brandMark(site: Site | null, size: number): HTMLElement {
  const name = site?.name || 'Community';
  if (site?.logo) {
    const img = el('img', 'brand-logo');
    img.src = site.logo;
    img.alt = name;
    img.height = size;
    img.style.height = `${size}px`;
    return img;
  }
  const mono = el('span', 'brand-monogram', initials(name));
  mono.setAttribute('aria-hidden', 'true');
  mono.style.width = `${size}px`;
  mono.style.height = `${size}px`;
  mono.style.fontSize = `${size * 0.4}px`;
  return mono;
}

const PAGE_TITLES: Record<string, string> = {home: '', blog: 'Blog', 404: 'Page not found'};

function renderBrand(site: Site | null): void {
  const name = site?.name || 'Community';

  document.querySelectorAll<HTMLElement>('[data-brand-name]').forEach(node => {
    node.textContent = name;
  });
  document.querySelectorAll<HTMLElement>('[data-brand-mark]').forEach(node => {
    node.replaceChildren(brandMark(site, Number(node.dataset.brandMark) || 32));
  });

  document.querySelectorAll<HTMLElement>('[data-year]').forEach(node => {
    node.textContent = String(new Date().getUTCFullYear());
  });

  if (site?.favIcon) {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? el('link');
    icon.rel = 'icon';
    icon.href = site.favIcon;
    document.head.appendChild(icon);
  }

  if (page in PAGE_TITLES) setTitle(PAGE_TITLES[page]!, site?.name);
}

/* ------------------------------------------------------------------- posts */

function postCard(post: Post): HTMLElement {
  const card = el('a', 'post-card');
  card.href = postUrl(post.slug);

  if (post.coverUrl) {
    const img = el('img', 'cover');
    img.src = post.coverUrl;
    img.alt = '';
    img.loading = 'lazy';
    card.appendChild(img);
  } else {
    card.appendChild(el('span', 'cover cover-empty'));
  }

  const body = el('div', 'post-card-body');
  body.append(
    el('h3', '', post.title),
    el('p', 'muted small', preview(post.excerpt, undefined, 110)),
    el('p', 'meta', formatDate(post.publishedAt))
  );
  card.appendChild(body);
  return card;
}

async function loadHome(): Promise<void> {
  const section = byId('latest-posts');
  const grid = byId('latest-grid');
  if (!section || !grid) return;

  const data = await getJson<PostsPage>('/blog/post/all-posts?page=1&per_page=3');
  const posts = data?.data ?? [];
  if (posts.length === 0) return;

  grid.replaceChildren(...posts.map(postCard));
  section.hidden = false;
}

async function loadBlog(): Promise<void> {
  const current = Math.max(1, Number(new URLSearchParams(location.search).get('page')) || 1);
  const grid = byId('blog-grid');
  const empty = byId('blog-empty');
  const pager = byId('blog-pager');
  if (!grid || !empty || !pager) return;

  const data = await getJson<PostsPage>(`/blog/post/all-posts?page=${current}&per_page=9`);
  const posts = data?.data ?? [];
  const last = data?.meta?.lastPage ?? 1;

  if (posts.length === 0) {
    empty.hidden = false;
    return;
  }
  grid.replaceChildren(...posts.map(postCard));

  if (last > 1) {
    const nodes: HTMLElement[] = [];
    if (current > 1) {
      const newer = el('a', '', '← Newer');
      newer.href = current - 1 === 1 ? '/blog/' : `/blog/?page=${current - 1}`;
      nodes.push(newer);
    }
    nodes.push(el('span', 'muted small', `Page ${current} of ${last}`));
    if (current < last) {
      const older = el('a', '', 'Older →');
      older.href = `/blog/?page=${current + 1}`;
      nodes.push(older);
    }
    pager.replaceChildren(...nodes);
    pager.hidden = false;
  }
}

async function loadPost(site: Site | null): Promise<void> {
  const view = byId('post');
  const missing = byId('post-missing');
  if (!view || !missing) return;

  const notFound = () => {
    view.hidden = true;
    missing.hidden = false;
    setTitle('Post not found', site?.name);
  };

  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) return notFound();

  const post = await getJson<Post>(`/blog/post/${encodeURIComponent(slug)}/read`);
  if (!post) return notFound();

  setTitle(post.title, site?.name);
  byId('post-title')!.textContent = post.title;

  if (post.coverUrl) {
    // Quoted so a url containing ( or ) cannot end the css function early.
    byId('post-hero')!.style.backgroundImage = `url("${post.coverUrl.replace(/"/g, '%22')}")`;
  }

  const meta: HTMLElement[] = (post.authors ?? []).map(author => {
    const chip = el('span', 'author');
    const name = authorName(author);
    if (author.avatar) {
      const img = el('img');
      img.src = author.avatar;
      img.alt = '';
      img.width = 24;
      img.height = 24;
      chip.appendChild(img);
    } else {
      const fallback = el('span', 'avatar-fallback', initials(name));
      fallback.setAttribute('aria-hidden', 'true');
      chip.appendChild(fallback);
    }
    // Name only. A member's email is never shown.
    chip.append(name);
    return chip;
  });
  if (post.publishedAt) meta.push(el('span', '', formatDate(post.publishedAt)));
  meta.push(el('span', '', `${readingMinutes(post.content ?? '')} minute read`));
  byId('post-meta')!.replaceChildren(...meta);

  // The one HTML write — see the file header.
  byId('post-body')!.innerHTML = post.content ?? '';

  const chips = [
    ...(post.categories ?? []).map(term => el('span', 'chip', term.name)),
    ...(post.tags ?? []).map(term => el('span', 'chip chip-tag', `#${term.name}`)),
  ];
  const terms = byId('post-terms')!;
  if (chips.length > 0) {
    terms.replaceChildren(...chips);
    terms.hidden = false;
  }

  view.hidden = false;
}

/* -------------------------------------------------------------------- boot */

void getJson<Site>('/site/v1/initial-data').then(site => {
  renderBrand(site);
  if (page === 'post') void loadPost(site);
});

if (page === 'home') void loadHome();
if (page === 'blog') void loadBlog();
