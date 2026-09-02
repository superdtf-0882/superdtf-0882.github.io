// The Open Wire — /wire. WP-WIRE-01 activity 7.
//
// Contract AC-011 (Issued). Decision ADR-009 (Approved, v3). Shape A: this
// route FETCHES finished editions from the content repository. The pipeline
// never writes here.
//
// THE FETCH IS WRAPPED AND CANNOT FAIL THE BUILD. Activity 1 measured that a
// revalidating route's first render is a BUILD input, so an unreachable
// content repository is a build-time failure and an uncaught one exits the
// build for the WHOLE of davidfacer.com — not just /wire. AC-011's
// ac_prohibited names this. The catch below is that clause.

import './wire.css';
import { CURRENCY_BASIS, EDITION_URL, formatBasis } from './basis';

// REQ-OPS-6, restated against revalidation rather than deploy. On-demand
// revalidation from the generate job is the primary path — activity 1 measured
// that time-based regeneration is REQUEST-driven, so the first reader after an
// edition lands would otherwise be served the previous one. This interval is
// the backstop for when that call fails, and 300s matches the 5 minutes
// REQ-OPS-6 originally expressed against deploys.
export const revalidate = 300;

export const metadata = {
  title: 'The Open Wire — David Facer',
  description:
    'A paywall-free news digest, compiled twice daily by an AI model from retrieved sources. Not the site owner’s reporting.',
};

async function getEdition() {
  // Returns { edition, error } and NEVER throws. A degraded render is the
  // requirement; a thrown error here takes the whole site's build with it.
  try {
    const res = await fetch(EDITION_URL, { next: { revalidate } });
    if (!res.ok) return { edition: null, error: `HTTP ${res.status}` };
    const edition = await res.json();
    if (!edition || typeof edition !== 'object' || !Array.isArray(edition.groups)) {
      return { edition: null, error: 'edition payload is not the expected shape' };
    }
    return { edition, error: null };
  } catch (e) {
    return { edition: null, error: e && e.message ? e.message : 'unreachable' };
  }
}

export default async function Wire() {
  const { edition, error } = await getEdition();

  // THE CURRENCY-BASIS LINE DERIVES FROM THE SERVED PAYLOAD, never from
  // configuration. ADR-009 clause (7), on DT2's ruling: under revalidation a
  // route can serve edition N−1 while configuration names N, so a
  // config-derived line would claim N while rendering N−1. Activity 1 measured
  // that happening — a render two minutes stale served at two separate
  // observations.
  const basis = formatBasis(edition);

  return (
    <>
      <div className="site-topbar">
        <a href="https://davidfacer.com/" className="site-identity-mark">
          <img src="/HeadshotBW.jpg" alt="" />
          <span>David Facer</span>
        </a>
        <div className="site-breadcrumb">
          <a href="https://davidfacer.com/">← davidfacer.com</a>
          <span className="site-breadcrumb-sep">/</span>
          <span>Research</span>
        </div>
      </div>

      <header>
        <div>
          <h1>The Open Wire</h1>
          <div className="header-sub">Paywall-free news, twice daily</div>
        </div>
        <div className="header-right">
          <span className="basis">{basis}</span>
        </div>
      </header>

      {/* REQ-LEG-3. Permanent and prominent, above the content rather than in
          a footer, and it is NOT conditional on an edition having loaded. */}
      <div className="notice" role="note">
        <strong>Written by an AI model.</strong>{' '}
        {edition?.notice?.automatedGeneration ||
          'Every brief and analysis line on this page is written by an AI model from retrieved sources. It is not the site owner’s reporting, analysis or endorsement.'}
      </div>

      <main className="main">
        {error && <Degraded error={error} />}
        {!error && !edition && <Degraded error="no edition available" />}
        {edition && <Edition edition={edition} />}
      </main>

      {/* REQ-LEG-7. A visible correction route, present whether or not an
          edition rendered. */}
      <footer className="wire-footer">
        <p>
          Items are summarised from the linked originals; outlets are named and linked
          (<span className="req">REQ-LEG-2</span>). Paywalled stories are named and{' '}
          <strong>not linked</strong> — this digest does not route around paywalls.
        </p>
        <p>
          To request a correction or the removal of an item, email{' '}
          <a href="mailto:superdtf@gmail.com?subject=The%20Open%20Wire%20—%20correction%20request">
            superdtf@gmail.com
          </a>{' '}
          with the item’s headline and the edition timestamp above.
        </p>
      </footer>

      <a href="https://davidfacer.com/" className="site-attribution">© 2026 David Facer</a>
    </>
  );
}

// The degraded state. AC-011: the route "catches its own fetch failure and
// renders a degraded state naming the last edition it holds." There is no
// cached edition to name on a cold render, so it says so plainly rather than
// showing an empty page that reads like a bug.
function Degraded({ error }) {
  return (
    <div className="degraded">
      <h2>No edition is available right now.</h2>
      <p>
        The digest is compiled twice daily and this page could not reach the latest
        edition. Nothing is wrong with the rest of the site — try again shortly.
      </p>
      <p className="detail">Reason: {error}</p>
    </div>
  );
}

function Edition({ edition }) {
  const groups = edition.groups || [];
  const paywalled = edition.paywalled || [];
  const empty = groups.every((g) => (g.sections || []).every((s) => !(s.items || []).length));

  if (empty) return <Degraded error="the edition contains no items" />;

  return (
    <>
      {groups.map((g) => (
        <section key={g.id} className="group">
          <h2 className="group-label">{g.label}</h2>
          {(g.sections || []).map((s) =>
            (s.items || []).length ? (
              <div key={s.id} className="section">
                <h3 className="section-label">{s.label}</h3>
                <ul className="items">
                  {s.items.map((it) => (
                    <li key={it.id} className="item">
                      <a className="headline" href={it.url} target="_blank" rel="noopener noreferrer">
                        {it.headline}
                      </a>
                      <div className="meta">
                        {/* REQ-LEG-2: the outlet is named, not only linked. */}
                        <span className="outlet">{it.source}</span>
                        <span className="sep">·</span>
                        <span>{it.publishedDate}</span>
                        {it.kind && it.kind !== 'news' && (
                          <>
                            <span className="sep">·</span>
                            <span className="kind">{it.kind}</span>
                          </>
                        )}
                      </div>
                      {it.brief && <p className="brief">{it.brief}</p>}
                      {/* `why` is OPTIONAL by design. WIRE-SPEC-A1 A1-011: an
                          edition is never blocked by analysis failure, and a
                          dropped line leaves the item published without it. */}
                      {it.why && <p className="why">{it.why}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </section>
      ))}

      {/* REQ-LEG-5: paywalled stories are NAMED AND UNLINKED. The deny list
          exists to keep readers out of paywalls, not to evade them. */}
      {paywalled.length > 0 && (
        <section className="group paywalled">
          <h2 className="group-label">Behind paywalls</h2>
          <p className="paywalled-note">
            Named because they matter, unlinked because they are not free to read. No
            summary is offered — this digest does not read around a paywall.
          </p>
          <ul className="items">
            {paywalled.map((p, i) => (
              <li key={i} className="item">
                <span className="headline plain">{p.headline}</span>
                <div className="meta">
                  <span className="outlet">{p.outlet}</span>
                  {p.area && (
                    <>
                      <span className="sep">·</span>
                      <span>{p.area}</span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export { CURRENCY_BASIS };
