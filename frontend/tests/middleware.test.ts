// Run with: npm run test:middleware
//
// The canonical-host redirect sits in front of every request and all of its
// failure modes are silent: bounce the e2e stack to a dead host, strip a ?c=
// shift code, or accidentally pull /shift behind the login gate. None of that
// shows up in a typecheck, so it gets covered here.

import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "../src/lib/constants";
import { middleware } from "../src/middleware";

const HOSTED = "https://snappyforms--snappy-forms.us-east4.hosted.app";
const CANON = "https://snappyforms.org";

function call(url: string, { proto, cookie }: { proto?: string; cookie?: boolean } = {}) {
  const headers = new Headers();
  headers.set("host", new URL(url).host);
  if (proto) headers.set("x-forwarded-proto", proto);
  if (cookie) headers.set("cookie", `${SESSION_COOKIE}=token`);
  return middleware(new NextRequest(url, { headers }));
}

// --- production: canonical origin is https -----------------------------------
process.env.APP_BASE_URL = CANON;

const offOrigin = call(`${HOSTED}/dashboard`, { proto: "https", cookie: true });
assert.equal(offOrigin.status, 308, "hosted.app should be redirected");
assert.equal(
  offOrigin.headers.get("location"),
  `${CANON}/dashboard`,
  "redirect should land on the canonical origin",
);

// The whole point of the exercise: a scanned shift URL keeps its code.
const shift = call(`${HOSTED}/shift/abc123?c=558104`, { proto: "https" });
assert.equal(shift.status, 308);
assert.equal(
  shift.headers.get("location"),
  `${CANON}/shift/abc123?c=558104`,
  "?c= must survive canonicalisation",
);

const onOrigin = call(`${CANON}/dashboard`, { proto: "https", cookie: true });
assert.notEqual(onOrigin.status, 308, "canonical origin over https should not redirect");

// TLS terminates at the edge; do not loop on an internal HTTP proxy hop.
const insecure = call(`${CANON}/dashboard`, { proto: "http", cookie: true });
assert.notEqual(insecure.status, 308, "canonical host must not redirect to itself behind a proxy");

// Health checks and container-internal traffic must never be moved.
assert.notEqual(
  call("http://localhost:3000/login", { proto: "http" }).status,
  308,
  "localhost should be exempt",
);
assert.notEqual(
  call("http://192.168.1.20:3000/login", { proto: "http" }).status,
  308,
  "LAN addresses should be exempt",
);

// Widening the matcher must not have widened the auth gate.
assert.notEqual(
  call(`${CANON}/shift/abc123?c=558104`, { proto: "https" }).status,
  308,
  "/shift on the canonical origin should pass straight through",
);

const gated = call(`${CANON}/dashboard`, { proto: "https" });
assert.equal(gated.status, 307, "protected path without a session should go to /login");
assert.match(gated.headers.get("location") ?? "", /\/login\?next=%2Fdashboard/);

assert.notEqual(call(`${CANON}/login`, { proto: "https" }).status, 307, "/login must stay reachable");

// --- local docker: canonical origin is http, so canonicalisation is off ------
// e2e reaches the app at http://webapp:3000 while APP_BASE_URL says localhost.
// Redirecting here would send the whole suite to a host that does not resolve
// inside the test container.
process.env.APP_BASE_URL = "http://localhost:3000";

assert.notEqual(
  call("http://webapp:3000/login", { proto: "http" }).status,
  308,
  "docker service hostname must not be redirected",
);
assert.notEqual(call("http://webapp:3000/shift/abc?c=1", { proto: "http" }).status, 308);

// --- unset: never crash the site ---------------------------------------------
delete process.env.APP_BASE_URL;
assert.notEqual(
  call(`${HOSTED}/login`, { proto: "https" }).status,
  308,
  "no APP_BASE_URL means no canonical target",
);

// The public PDF template shares the /forms prefix with authenticated pages.
assert.equal(call(`${HOSTED}/forms/pa-1938.pdf`).status, 200, "PDF template must not redirect to login");

// Adding the prototype must not replace or block the existing demo/login flow.
process.env.APP_BASE_URL = CANON;
for (const path of ["/", "/demo", "/prototype", "/prototype?review=demo", "/login", "/forms/pa-1938.pdf"]) {
  assert.equal(call(`${CANON}${path}`).status, 200, `${path} must remain available`);
}
assert.equal(call(`${HOSTED}/prototype?review=demo`).headers.get("location"), `${CANON}/prototype?review=demo`);
console.log("middleware: all assertions passed");
