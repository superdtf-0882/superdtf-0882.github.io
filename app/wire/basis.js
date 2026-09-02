// The currency-basis line, and the one place the edition URL is written.
//
// ADR-009 clause (7), on DT2's ruling 2026-08-31: THE LINE DERIVES FROM THE
// SERVED PAYLOAD -- the edition id and generation timestamp of the edition
// ACTUALLY RENDERED -- and never from configuration.
//
// WHY THAT IS NOT PEDANTRY. Under revalidation a route can serve edition N-1
// while configuration names N. Activity 1 measured exactly that on this
// project: a render two minutes stale served at two separate observations. A
// config-derived line would have been lying at both moments. The Whole-Model
// Views on aimaturitymodels.com derive their line from a constant because
// their basis IS a constant; this one cannot, and the shared principle is that
// the line describes WHAT THE READER IS BEING SERVED.

// Shape A: the site fetches from the content repository. Pinned to a branch
// rather than a tag because editions are append-only and the newest is always
// wanted -- and the branch is recorded in the corpus as A11's deployment_branch.
// OPEN_WIRE_EDITION_URL overrides the default so a build can be pointed at a
// staging edition or a fixture. It is a build-time convenience, NOT a second
// source of truth: unset -- which is how production runs -- the default below
// is the only address, and it is the one recorded in the corpus.
export const EDITION_URL =
  process.env.OPEN_WIRE_EDITION_URL ||
  'https://raw.githubusercontent.com/superdtf-0882/open-wire-editions/main/editions/current.json';

export const CURRENCY_BASIS =
  'Derived from the edition actually served, not from configuration (ADR-009 clause 7).';

// Returns the line for the edition in hand. A null edition yields a line that
// says so -- it must never fall back to "now", which would assert freshness
// the page does not have.
export function formatBasis(edition) {
  if (!edition || !edition.generatedAt) return 'No edition loaded';
  const when = new Date(edition.generatedAt);
  if (Number.isNaN(when.getTime())) return 'Edition timestamp unreadable';
  const stamp = when.toLocaleString('en-US', {
    timeZone: 'America/Denver',
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const n = typeof edition.itemCount === 'number' ? edition.itemCount : null;
  return `Edition ${stamp} MT${n !== null ? ` · ${n} items` : ''}`;
}
