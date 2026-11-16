// Finance for Product Managers -- the page's sums, in one file the page and its self-test both
// load (scripts/prodmanfinance-self-test.js, run in the site's build). Moved unchanged in meaning
// from DTOG's page (OKF-TOGAF#243): rates are in percent, cash in whole currency, years from now.
// Pure: no page, no storage, nothing sent.
(function (root) {
  'use strict';

  // Cost of equity by CAPM: risk-free rate plus beta times the market's premium.
  const costOfEquity = (rf, beta, mkt) => rf + beta * (mkt - rf);

  // Weighted cost of capital: equity's share of total funding at its cost, debt's at its
  // after-tax cost. eqPct is a share of total funding, not a debt-to-equity ratio.
  const wacc = (ke, eqPct, kd, taxPct) => {
    const e = eqPct / 100;
    return e * ke + (1 - e) * kd * (1 - taxPct / 100);
  };

  // The bar to clear: the cost of capital plus the project's extra risk, or a rate finance
  // gives; a scenario may move it by a number of points.
  const hurdle = (waccPct, adj, useGiven, given, bump = 0) => (useGiven ? given : waccPct + adj) + bump;

  // The project's cash at a rate r (%), as [{t, v}]: the spend at year 0, five years of extra
  // after-tax cash, and, if asked, the value after year 5. Scenario changes: scale (cash a
  // year), inv (the spend), shift (years later). Returns null when the value after year 5
  // can't be computed: growth at or above the rate.
  function flows(p, r, o = {}) {
    const scale = o.scale ?? 1, inv = o.inv ?? 1, shift = o.shift ?? 0;
    const out = [{ t: 0, v: -p.inv * inv }];
    p.cf.forEach((c, i) => out.push({ t: i + 1 + shift, v: c * scale }));
    if (p.tv) {
      const rr = r / 100, g = p.g / 100;
      if (rr <= g) return null;
      out.push({ t: 5 + shift, v: (p.cf[4] * scale * (1 + g)) / (rr - g), tv: true });
    }
    return out;
  }

  // Present value of cash flows at r (%).
  const pv = (f, r) => f.reduce((s, x) => s + x.v / Math.pow(1 + r / 100, x.t), 0);

  // Net present value at r: the flows' value, or NaN when they can't be computed.
  function npvAt(p, r, o = {}) {
    const f = flows(p, r, o);
    return f ? pv(f, r) : NaN;
  }

  // Internal rate of return (%), by halving between -99% and 1000%; null when none is bracketed.
  function irr(f) {
    const at = (r) => pv(f, r * 100);
    let lo = -0.99, hi = 10, flo = at(lo), fhi = at(hi);
    if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) return null;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2, fm = at(mid);
      if (Math.abs(fm) < 1e-7) return mid * 100;
      if (flo * fm < 0) { hi = mid; } else { lo = mid; flo = fm; }
    }
    return ((lo + hi) / 2) * 100;
  }

  // How many times the cash changes sign, zeros skipped. More than one: the return can't be trusted.
  function signChanges(f) {
    let n = 0, prev = 0;
    f.forEach((x) => { if (x.v === 0) return; const s = Math.sign(x.v); if (prev && s !== prev) n++; prev = s; });
    return n;
  }

  // The year in which the running total first reaches zero, interpolated within the year;
  // r = 0 for simple payback, the hurdle for discounted. null if not within five years.
  function payback(inv, cf, r) {
    let cum = -inv;
    if (cum >= 0) return 0;
    for (let i = 0; i < 5; i++) {
      const v = cf[i] / Math.pow(1 + r / 100, i + 1);
      if (cum + v >= 0 && v > 0) return i + (-cum) / v;
      cum += v;
    }
    return null;
  }

  // Running totals, undiscounted (u) and discounted at r (d), year 0 to year 5.
  function cumulative(inv, cf, r) {
    const u = [-inv], d = [-inv];
    cf.forEach((c, i) => { u.push(u[i] + c); d.push(d[i] + c / Math.pow(1 + r / 100, i + 1)); });
    return { u, d };
  }

  const Finance = { costOfEquity, wacc, hurdle, flows, pv, npvAt, irr, signChanges, payback, cumulative };
  if (typeof module !== 'undefined' && module.exports) module.exports = Finance;
  else root.Finance = Finance;
})(typeof window !== 'undefined' ? window : this);
