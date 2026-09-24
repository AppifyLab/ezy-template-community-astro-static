import {defineConfig} from 'astro/config';
import {loadEnv} from 'vite';

// A fully static site: NO adapter. `astro build` writes plain files to dist/,
// including dist/404.html, which the platform serves for any address that has
// no page.
//
// The pages read your community's data in the browser, from /api on their own
// address. Deployed, that is your community itself; `npm run dev` has no API,
// so the dev server passes /api through to EZY_SITE_URL (see .env.example).
const {EZY_SITE_URL} = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

export default defineConfig({
  vite: {
    server: {
      proxy: EZY_SITE_URL
        ? {'/api': {target: EZY_SITE_URL, changeOrigin: true}}
        : undefined,
    },
  },
});
