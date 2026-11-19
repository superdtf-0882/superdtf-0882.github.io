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

  // ---------- The revenue ramp, by month (draft) ----------
  // Time is in months after launch; month m covers (m - 1, m]. Revenue is recurring revenue a
  // month; "keep" is the share of each revenue dollar the project keeps after the costs that grow
  // with sales and after tax. Nothing here discounts: the monthly results are summed into each year
  // and counted at that year's end, the convention step 3's cash already uses, by annualDelta.

  const MONTHS = 60;

  // Simple ramp: recurring revenue rises in a straight line from nothing at launch to full speed,
  // M a month, at month R, then holds. Returns revenue for months 1..n.
  function rampRevenue(M, R, n = MONTHS) {
    const G = (t) => (t <= 0 ? 0 : R <= 0 ? t : t < R ? (t * t) / (2 * R) : R / 2 + (t - R));
    const out = [];
    for (let m = 1; m <= n; m++) out.push(M * (G(m) - G(m - 1)));
    return out;
  }

  // Customer onboarding. From launch, N customers a month start onboarding, until enough have
  // finished to reach P paying customers. A share c (percent) of starters finish and pay A a month,
  // starting d months after they began. Each starter costs K once, in the month they start.
  // Returns revenue, onboarding cost and paying customers (at each month's end) for months 1..n,
  // and the month full speed is reached.
  function onboarding(o, n = MONTHS) {
    const c = o.c / 100, rate = o.N * c;
    const T = rate > 0 ? o.P / rate : Infinity; // months of intake
    const paying = (t) => (t <= o.d ? 0 : rate * Math.min(t - o.d, T));
    const area = (t) => { // paying customers integrated over time, from 0 to t
      const u = t - o.d;
      if (u <= 0) return 0;
      return u < T ? (rate * u * u) / 2 : (rate * T * T) / 2 + rate * T * (u - T);
    };
    const overlap = (a, b) => Math.max(0, Math.min(b, T) - Math.max(a, 0));
    const revenue = [], cost = [], payingEnd = [];
    for (let m = 1; m <= n; m++) {
      revenue.push(o.A * (area(m) - area(m - 1)));
      cost.push(o.K * o.N * overlap(m - 1, m));
      payingEnd.push(paying(m));
    }
    return { revenue, cost, paying: payingEnd, fullAt: o.d + T };
  }

  // The change to each year's cash when monthly revenue and onboarding cost move from a base path
  // to a scenario path: kept revenue, less onboarding cost after tax, summed by year (years 1..5).
  function annualDelta(baseRev, scnRev, baseCost, scnCost, keepPct, taxPct) {
    const out = [0, 0, 0, 0, 0];
    for (let m = 0; m < MONTHS; m++) {
      const dRev = (scnRev[m] || 0) - (baseRev[m] || 0);
      const dCost = ((scnCost && scnCost[m]) || 0) - ((baseCost && baseCost[m]) || 0);
      out[Math.floor(m / 12)] += (dRev * keepPct) / 100 - (dCost * (100 - taxPct)) / 100;
    }
    return out;
  }

  // Onboarding assumptions that approximately reproduce a simple ramp to M a month at month R.
  // A straight ramp loses M x R / 2 of revenue against full speed from launch; a ramp that waits d
  // months and then rises for T months loses M x (d + T / 2). Equal losses give T = R - 2d.
  // Revenue per customer A and the finishing share c are taken as given.
  function onboardingFromRamp(M, R, A, c, K) {
    const d = R >= 6 ? 2 : Math.max(0, Math.floor((R - 1) / 2));
    const T = Math.max(1, R - 2 * d);
    const P = M / A;
    return { N: P / ((c / 100) * T), d, c, A, K, P };
  }

  // The simple ramp an onboarding setup amounts to, by the same equal-loss rule.
  const rampFromOnboarding = (o) => ({ M: o.P * o.A, R: 2 * o.d + o.P / (o.N * (o.c / 100)) });

  // The x in [lo, hi] where f(x) = 0, by halving, for f that changes sign once; null if it doesn't.
  function solve(f, lo, hi) {
    let flo = f(lo), fhi = f(hi);
    if (!Number.isFinite(flo) || !Number.isFinite(fhi)) return null;
    if (flo === 0) return lo;
    if (flo * fhi > 0) return null;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2, fm = f(mid);
      if (flo * fm <= 0) { hi = mid; } else { lo = mid; flo = fm; }
    }
    return (lo + hi) / 2;
  }

  const Finance = { costOfEquity, wacc, hurdle, flows, pv, npvAt, irr, signChanges, payback, cumulative,
    MONTHS, rampRevenue, onboarding, annualDelta, onboardingFromRamp, rampFromOnboarding, solve };
  if (typeof module !== 'undefined' && module.exports) module.exports = Finance;
  else root.Finance = Finance;
})(typeof window !== 'undefined' ? window : this);
