// On-demand revalidation. WP-WIRE-01 activity 4's consequence, built here
// because the route is the SITE's own artifact.
//
// SHAPE A HOLDS. The generate job CALLS this; it does not write to this
// repository. ADR-009's decision is that the machine writes data to the
// content repo and the site fetches it -- a call is not a write.
//
// WHY IT EXISTS: activity 1 measured that time-based regeneration is
// REQUEST-driven. The first reader after an edition lands is served the
// PREVIOUS one, and their visit is what triggers the rebuild. On a low-traffic
// page that reader may be the only one for hours. ADR-009 R3 as amended to v3.

import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// The shared secret is a SECOND credential-register entry beside the Anthropic
// key. It is read from the environment only and is never logged, never
// returned in a response body, and never compared in a way that echoes it.
function authorised(request) {
  const expected = process.env.OPEN_WIRE_REVALIDATE_SECRET;
  if (!expected) return { ok: false, status: 503, detail: 'revalidation secret not configured' };
  const given = request.headers.get('x-open-wire-secret');
  if (!given) return { ok: false, status: 401, detail: 'missing credential' };
  // A length mismatch is reported as the same generic failure as a value
  // mismatch, so the response distinguishes neither.
  if (given.length !== expected.length) return { ok: false, status: 403, detail: 'rejected' };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return { ok: false, status: 403, detail: 'rejected' };
  return { ok: true };
}

export async function POST(request) {
  const auth = authorised(request);
  if (!auth.ok) {
    return Response.json({ revalidated: false, detail: auth.detail }, { status: auth.status });
  }

  let editionId = null;
  try {
    const body = await request.json();
    editionId = body && typeof body.editionId === 'string' ? body.editionId : null;
  } catch (e) {
    // A malformed body is not a reason to refuse: the edition id is for the
    // log, not for the decision.
  }

  revalidatePath('/wire');
  return Response.json({ revalidated: true, editionId, at: new Date().toISOString() });
}

// A GET is not an error and deliberately does NOT revalidate: a crawler or a
// link preview must not be able to trigger cache work.
export async function GET() {
  return Response.json(
    { ok: true, detail: 'POST with x-open-wire-secret to revalidate /wire' },
    { status: 200 }
  );
}
