# superdtf-0882.github.io

David's homepage — served at [davidfacer.com](https://davidfacer.com).

Migrated from GitHub Pages to a Next.js (App Router) project on Vercel (ADR-001). GitHub Pages is currently disabled; the repo name is unchanged from before the migration for continuity.

## Stack

- Next.js (App Router), deployed on Vercel
- Every visible page is plain static HTML in `/public` — there is no client-side framework rendering on the main site itself. Next.js is only used for routing/hosting.

## Routing

Next's `/public` folder serves files at their literal path only — it does not do directory-index resolution the way GitHub Pages did. Every page on this site is a directory-style URL (`/professional/`, `/sampleprototypes/`, etc.), so `next.config.js` carries an explicit rewrite (`path/` → `path/index.html`) for each one, plus `trailingSlash: true` so the canonical form matches every existing URL. When adding a new static page under `/public`, add its path to the `staticPages` list in `next.config.js` or it will 404.

`next.config.js` also carries a redirect for the orphaned `/professional/enterprise-architecture/sdlc-maturity/` path → `aisdlc.davidfacer.com/maturitymodelassessment/` (that tool moved there in WP2b).

## Embedded / ported apps

- **`/complexity-sovereignty-assessment/`** — a separate Vite + React app ([`complexity-sovereignty-assessment` repo](https://github.com/superdtf-0882/complexity-sovereignty-assessment)). Not built from this repo — after any change there, run `npm run build` in that repo and copy `dist/*` into `public/complexity-sovereignty-assessment/` here, then rebuild/redeploy this project.
- **`/blackseamonitor/`** — a static HTML shell copied from the [`BlackSeaRealEstate` repo](https://github.com/superdtf-0882/BlackSeaRealEstate)'s `public/index.html`, with its API and data-file fetches pointed at absolute URLs on the live `black-sea-real-estate.vercel.app` deployment (which keeps running independently — its cron job, Vercel Blob store, and secrets are untouched). This page fetches live cross-origin, so it isn't a build artifact like the assessment tool above — just copy `index.html` again if the source app's front-end changes.

## Local development

```bash
npm install
npm run dev
```

## Deployment

Push to `wp2a-vercel-migration` (the branch Vercel currently builds from — `main` still reflects the pre-migration static site and is not what's deployed). Vercel does not auto-promote new deployments to Production on this project; promote manually after checking the preview.
