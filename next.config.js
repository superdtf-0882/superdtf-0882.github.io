/** @type {import('next').NextConfig} */
// Next.js's /public folder serves files at their exact path only — it does not
// do directory-index resolution the way GitHub Pages does. Every static page in
// this site is a directory-style URL (trailing slash), so each one needs an
// explicit rewrite to its index.html. trailingSlash keeps `/professional`
// canonicalizing to `/professional/` instead of the other way around, matching
// every existing GitHub Pages URL.
const staticPages = [
  '/',
  '/professional/',
  '/professional/enterprise-architecture/',
  '/professional/cv/',
  '/sampleprototypes/',
  '/complexity-sovereignty-assessment/',
  '/blackseamonitor/',
];

const nextConfig = {
  trailingSlash: true,
  async rewrites() {
    return staticPages.map((path) => ({
      source: path,
      destination: `${path}index.html`,
    }));
  },
  // WP2b moved the SDLC Maturity Assessment to aisdlc.davidfacer.com. This
  // path is now orphaned on the main site — redirect rather than leave it
  // as dead weight (WP2 remainder item #3).
  //
  // 2026-07-29 (briefs/2026-07-29-davidfacer-retire/, OKF TOGAF): the
  // Enterprise Architecture & Product Methodology Career panel destination
  // retired -- superseded by aimaturitymodels.com. The sdlc-maturity
  // redirect below is repointed straight at the final destination rather
  // than left chaining through aisdlc.davidfacer.com's own new redirect
  // (which now points to the same place) -- one hop, not two.
  async redirects() {
    return [
      {
        source: '/professional/enterprise-architecture/sdlc-maturity/',
        destination: 'https://aimaturitymodels.com/models/sdlc/assessment',
        permanent: true,
      },
      {
        source: '/professional/enterprise-architecture/',
        destination: 'https://aimaturitymodels.com',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
