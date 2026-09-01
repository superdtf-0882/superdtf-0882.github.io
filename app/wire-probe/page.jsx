// WP-WIRE-01 activity 1 — the probe. A measuring instrument, not a surface.
// DELETE THIS ROUTE once the observation is recorded.
//
// Answers the two questions the local build could not: revalidation timing
// on Vercel against the configured interval, and what a reader is served
// when a fixture is unreachable but the failure is CAUGHT.
//
// The catch is not incidental. Activity 1 established locally that an
// UNCAUGHT build-time fetch failure exits the whole davidfacer.com build
// ("Export encountered an error ... exiting the build"), which is why
// AC-011 now prohibits it. This route is built the way the contract
// requires: it catches, and degrades.

export const revalidate = 60;

const GOOD =
  'https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/main/short_form.yml';
const BAD =
  'https://raw.githubusercontent.com/superdtf-0882/does-not-exist-99/main/nope.yml';

async function probe(url) {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    return { ok: true, detail: `${(await res.text()).length} bytes` };
  } catch (e) {
    return { ok: false, detail: e.message };
  }
}

export default async function WireProbe() {
  const renderedAt = new Date().toISOString();
  const good = await probe(GOOD);
  const bad = await probe(BAD);

  return (
    <main style={{ fontFamily: 'ui-monospace, monospace', padding: '2rem', lineHeight: 1.7 }}>
      <h1>wire-probe</h1>
      <p>
        WP-WIRE-01 activity 1. A measuring instrument for revalidation behaviour,
        not a product surface. It will be removed.
      </p>
      <dl>
        <dt>rendered at</dt>
        <dd data-probe="rendered-at">{renderedAt}</dd>
        <dt>revalidate interval</dt>
        <dd>{revalidate}s</dd>
        <dt>reachable fixture</dt>
        <dd data-probe="good">{good.ok ? good.detail : `FAILED ${good.detail}`}</dd>
        <dt>unreachable fixture (caught)</dt>
        <dd data-probe="bad">{bad.ok ? bad.detail : `degraded: ${bad.detail}`}</dd>
      </dl>
      <p>
        A caught failure renders this page in a degraded state rather than
        failing the build, which is what AC-011 requires.
      </p>
    </main>
  );
}
