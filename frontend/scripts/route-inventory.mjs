// Generates the route inventory: every page and API route under src/app, with
// what each one depends on, who links to it, and which test touches it.
//
// Demo work keeps adding routes (some DB-backed, some frontend-only), and the
// hand-written site map goes stale the moment a page is added. This script is
// the part of the map that can be derived from the code, so it can be re-run
// instead of re-surveyed. It reads source text only: no build, no database, no
// dependencies beyond Node.
//
//   npm run routes            rewrite docs/planning/architecture/routes.generated.{md,json}
//   npm run routes -- --check exit 1 if those files are out of date
//
// Everything here is static analysis by regex, so treat the columns as leads,
// not proof: a fetch built from a variable, or a link assembled at runtime, is
// invisible to it. Output is sorted and carries no timestamp, so re-running on
// unchanged code produces no diff.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(FRONTEND, "..");
const SRC = path.join(FRONTEND, "src");
const APP = path.join(SRC, "app");
const OUT_DIR = path.join(REPO, "docs", "planning", "architecture");
const OUT_MD = path.join(OUT_DIR, "routes.generated.md");
const OUT_JSON = path.join(OUT_DIR, "routes.generated.json");

const rel = (p) => path.relative(REPO, p).split(path.sep).join("/");
const read = (p) => readFileSync(p, "utf8");
const uniqSorted = (xs) => [...new Set(xs)].sort();

function walk(dir) {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const full = path.join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

// ---------------------------------------------------------------------------
// Import graph

const IMPORT_RE = /(?:import|export)\s[^'"`;]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function resolveImport(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // a package
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const importCache = new Map();
function importsOf(file) {
  if (!importCache.has(file)) {
    const out = { local: [], packages: [] };
    for (const m of read(file).matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2];
      const resolved = resolveImport(file, spec);
      if (resolved) out.local.push(resolved);
      else if (!spec.startsWith("@/") && !spec.startsWith(".")) out.packages.push(spec);
    }
    importCache.set(file, out);
  }
  return importCache.get(file);
}

function closure(entries) {
  const seen = new Set();
  const stack = [...entries];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    stack.push(...importsOf(f).local);
  }
  return seen;
}

const DB_FILE = path.join(SRC, "lib", "db.ts");
const touchesDb = (files) =>
  [...files].some((f) => f === DB_FILE || importsOf(f).packages.includes("@prisma/client"));

// UI code: a page or layout and the components it pulls in. src/lib is excluded
// on purpose: links and fetches live in UI files, and lib's palette-free helpers
// would only dilute the drift counts.
const isUiFile = (f) => !f.startsWith(path.join(SRC, "lib") + path.sep) && f.endsWith(".tsx");
const isDesignSystem = (f) => f.startsWith(path.join(SRC, "components", "ui") + path.sep);

// ---------------------------------------------------------------------------
// Route discovery

function urlFor(file) {
  const parts = path.relative(APP, path.dirname(file)).split(path.sep).filter(Boolean);
  const group = parts.find((p) => /^\(.+\)$/.test(p)) ?? "";
  const url = "/" + parts.filter((p) => !/^\(.+\)$/.test(p)).join("/");
  return { url, group };
}

function layoutsFor(file) {
  const layouts = [];
  let dir = path.dirname(file);
  while (dir.startsWith(APP)) {
    const layout = path.join(dir, "layout.tsx");
    if (existsSync(layout)) layouts.unshift(layout);
    if (dir === APP) break;
    dir = path.dirname(dir);
  }
  return layouts;
}

const allFiles = walk(APP);
const pageFiles = allFiles.filter((f) => path.basename(f) === "page.tsx");
const apiFiles = allFiles.filter((f) => path.basename(f) === "route.ts");

// Match a link or fetch target against route URLs segment by segment. A
// `[param]` in the route or a `[*]` (interpolation) in the target matches any
// segment. When several routes fit, keep only the most literal ones, so
// /api/activity/requests resolves to that route and not to /api/activity/[id],
// while /api/activity/${id}/${action} still resolves to every action route.
const isParam = (seg) => /^\[.+\]$/.test(seg);
const segments = (u) => (u === "/" ? [""] : u.replace(/\/$/, "").split("/"));
function bestMatches(target, urls) {
  const t = segments(target);
  let best = -1;
  let hits = [];
  for (const url of urls) {
    const u = segments(url);
    if (u.length !== t.length) continue;
    let score = 0;
    let ok = true;
    for (let i = 0; i < u.length && ok; i++) {
      if (u[i] === t[i]) score++;
      else if (!isParam(u[i]) && t[i] !== "[*]") ok = false;
    }
    if (!ok) continue;
    if (score > best) [best, hits] = [score, [url]];
    else if (score === best) hits.push(url);
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Middleware login gate

const middlewareSrc = read(path.join(SRC, "middleware.ts"));
const protectedPrefixes = [
  ...(middlewareSrc.match(/PROTECTED_PREFIXES\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g),
].map((m) => m[1]);
const isProtected = (url) => protectedPrefixes.some((p) => url === p || url.startsWith(`${p}/`));

// ---------------------------------------------------------------------------
// Source scanners

// `${anything}` inside a template literal becomes a wildcard segment.
const normalizeTarget = (raw) => raw.replace(/\$\{[^}]*\}/g, "[*]").split(/[?#]/)[0];

// Quoted first arguments to fetch(), whatever they point at.
function fetchesIn(text) {
  return [...text.matchAll(/fetch\(\s*(["'`])((?:(?!\1)[\s\S])*?)\1/g)].map((m) => m[2]);
}

// Every string or template literal naming an /api route. Catches the calls that
// go through a helper (postJson("/api/...")) or a variable (const url = `/api/...`;
// fetch(url)), and download links, which a fetch()-only scan misses.
function apiLiteralsIn(text) {
  return [...text.matchAll(/(["'`])(\/api\/(?:(?!\1)[^\n])*?)\1/g)].map((m) => m[2]);
}

const LINK_RES = [
  /\bhref=(["'])((?:(?!\1).)*)\1/g,
  /\bhref=\{\s*(["'`])((?:(?!\1).)*)\1\s*\}/g,
  /\bhref:\s*(["'`])((?:(?!\1).)*)\1/g,
  /\brouter\.(?:push|replace)\(\s*(["'`])((?:(?!\1).)*)\1/g,
  /\bredirect\(\s*(["'`])((?:(?!\1).)*)\1/g,
  /\bwindow\.location(?:\.href)?\s*=\s*(["'`])((?:(?!\1).)*)\1/g,
];
function linksIn(text) {
  return LINK_RES.flatMap((re) => [...text.matchAll(re)].map((m) => m[2]));
}

const PALETTE_RE =
  /\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|divide|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b|\b(?:bg|text|border)-(?:white|black)\b/g;
const ARBITRARY_COLOR_RE = /-\[(?:#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)a?\([^\]]*\))\]/g;
const COLOR_FN_RE = /\b(?:oklch|hsla?|rgba?)\(/g;
const INLINE_STYLE_RE = /\bstyle=\{\{/g;
const RAW_CONTROL_RE = /<(?:button|input|select|textarea)\b/g;
const count = (text, re) => (text.match(re) ?? []).length;

function driftOf(files) {
  const drift = { palette: 0, arbitraryColor: 0, colorFn: 0, inlineStyle: 0, rawControl: 0 };
  for (const f of files) {
    if (isDesignSystem(f)) continue;
    const t = read(f);
    drift.palette += count(t, PALETTE_RE);
    drift.arbitraryColor += count(t, ARBITRARY_COLOR_RE);
    drift.colorFn += count(t, COLOR_FN_RE);
    drift.inlineStyle += count(t, INLINE_STYLE_RE);
    drift.rawControl += count(t, RAW_CONTROL_RE);
  }
  return drift;
}

// ---------------------------------------------------------------------------
// Test coverage: which smoke/e2e/tour files mention a route.

const testFiles = [
  ...["smoke.mjs", "shift-flow.mjs", "pa1895-flow.mjs", "pw-smoke.mjs"].map((f) => path.join(FRONTEND, f)),
  ...walk(path.join(FRONTEND, "e2e")).filter((f) => /\.(mjs|ya?ml)$/.test(f)),
  ...walk(path.join(FRONTEND, "tests")).filter((f) => /\.ts$/.test(f)),
].filter(existsSync);
const testTexts = testFiles.map((f) => [rel(f), read(f)]);

function testsFor(url) {
  // Dynamic segments match a literal or an interpolation; the route must end at
  // a delimiter so /forms does not also claim /forms/pa-1938. The root only
  // counts when a script opens the bare base URL.
  const body =
    url === "/"
      ? String.raw`\$\{BASE_URL\}\/?`
      : url
          .split("/")
          .map((seg) => (isParam(seg) ? String.raw`(?:\$\{[^}]+\}|[^/\s"'\x60?#]+)` : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
          .join("/");
  const re = new RegExp(body + String.raw`(?=["'\x60?#\s),]|$)`, "m");
  return testTexts.filter(([, text]) => re.test(text)).map(([name]) => name);
}

// ---------------------------------------------------------------------------
// API routes

const apiRoutes = apiFiles.map((file) => {
  const { url } = urlFor(file);
  const src = read(file);
  const methods = uniqSorted(
    [...src.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)].map((m) => m[1]),
  );
  // Read from the route file itself: every route reaches src/lib/auth through
  // some shared helper, so the import graph would call them all "session".
  const auth = /x-snappyforms-client-(?:id|secret)/.test(src)
    ? "client-credentials"
    : /\bcreateSession\(/.test(src)
      ? "signs-in"
      : /\b(?:getCurrentSession|requireSession)\(/.test(src)
        ? "session"
        : /\[token\]/.test(url)
          ? "url-token"
          : "public";
  return {
    url,
    file: rel(file),
    methods,
    db: touchesDb(closure([file])),
    auth,
    demoGated: /isDemoMode\(|process\.env\.DEMO_MODE/.test(src),
    rateLimited: /\bcheckRateLimit\(/.test(src),
  };
});
const apiUrls = apiRoutes.map((r) => r.url);
const pageUrls = pageFiles.map((f) => urlFor(f).url);

// ---------------------------------------------------------------------------
// What a set of UI files fetches and links to.

function scanUi(uiFiles) {
  const texts = uiFiles.map(read);
  const rawApi = uniqSorted(texts.flatMap(apiLiteralsIn));
  const apiCalls = uniqSorted(rawApi.flatMap((raw) => bestMatches(normalizeTarget(raw), apiUrls)));
  const unresolvedFetches = uniqSorted([...rawApi, ...texts.flatMap(fetchesIn)]).filter(
    (raw) => bestMatches(normalizeTarget(raw), apiUrls).length === 0,
  );

  const deadLinks = [];
  const linksTo = [];
  for (const raw of uniqSorted(uiFiles.flatMap((f) => linksIn(read(f))))) {
    if (raw === "") deadLinks.push('"" (empty href)');
    else if (/^(?:https?:|mailto:|tel:|#)/.test(raw)) continue;
    else if (!raw.startsWith("/") && !raw.startsWith("$")) deadLinks.push(`${raw} (relative)`);
    else {
      const target = normalizeTarget(raw);
      if (target.startsWith("/api/") || target.startsWith("[*]")) continue; // downloads, .ics, computed links
      const hits = bestMatches(target, pageUrls);
      if (hits.length) linksTo.push(...hits);
      else deadLinks.push(`${raw} (no such page)`);
    }
  }
  return { apiCalls, unresolvedFetches, linksTo: uniqSorted(linksTo), deadLinks };
}

// Layouts are scanned once on their own. BottomNav lives in the (app) layout,
// and crediting its links and its unread-count poll to all 26 pages under it
// would drown out what each page does itself.
const layouts = new Map(
  allFiles
    .filter((f) => path.basename(f) === "layout.tsx")
    .map((file) => {
      const files = closure([file]);
      const label = path.relative(APP, file).split(path.sep).join("/");
      return [file, { label, files, ...scanUi([...files].filter(isUiFile)) }];
    }),
);

// ---------------------------------------------------------------------------
// Pages

const pages = pageFiles.map((file) => {
  const { url, group } = urlFor(file);
  const src = read(file);
  const own = closure([file]);
  const ownUi = [...own].filter(isUiFile);
  const wrapping = layoutsFor(file).map((l) => layouts.get(l));
  const { apiCalls, unresolvedFetches, linksTo, deadLinks } = scanUi(ownUi);

  const layoutCalls = wrapping.flatMap((l) => l.apiCalls);
  const callsDb = [...apiCalls, ...layoutCalls].some((u) => apiRoutes.find((r) => r.url === u)?.db);
  const direct = touchesDb(own) || wrapping.some((l) => touchesDb(l.files));
  const ownText = ownUi.map(read).join("\n");
  return {
    url,
    group: group || "(root)",
    file: rel(file),
    layouts: wrapping.map((l) => l.label),
    render: /^\s*["']use client["']/.test(src) ? "client" : "server",
    dynamic: url.includes("["),
    auth: isProtected(url) ? "middleware" : /redirect\(\s*["'`]\/login/.test(src) ? "page-redirect" : "public",
    db: direct ? "direct" : callsDb ? "via-api" : "none",
    demoMode: /isDemoMode\(|DEMO_MODE/.test(src) ? "gated" : /isDemoMode\(|DEMO_MODE/.test(ownText) ? "partial" : "",
    apiCalls,
    unresolvedFetches,
    linksTo: linksTo.filter((u) => u !== url),
    deadLinks,
    drift: driftOf(ownUi),
    tests: testsFor(url),
  };
});

for (const page of pages) {
  page.linkedFrom = uniqSorted([
    ...pages.filter((p) => p.linksTo.includes(page.url)).map((p) => p.url),
    ...[...layouts.values()].filter((l) => l.linksTo.includes(page.url)).map((l) => `nav: ${l.label}`),
  ]);
}
for (const api of apiRoutes) {
  api.calledFrom = uniqSorted([
    ...pages.filter((p) => p.apiCalls.includes(api.url)).map((p) => p.url),
    ...[...layouts.values()].filter((l) => l.apiCalls.includes(api.url)).map((l) => `nav: ${l.label}`),
  ]);
  api.tests = testsFor(api.url);
}


// ---------------------------------------------------------------------------
// Render

const byUrl = (a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0);
pages.sort(byUrl);
apiRoutes.sort(byUrl);

const json = JSON.stringify({ protectedPrefixes, pages, apiRoutes }, null, 2) + "\n";

const cell = (xs) => (xs.length ? xs.map((x) => `\`${x}\``).join(", ") : "—");
const short = (files) => files.map((f) => f.replace(/^frontend\//, "").replace(/^e2e\/tours\//, "tour:")).join(", ") || "—";
const linkedCell = (from) => {
  const nav = from.some((f) => f.startsWith("nav:"));
  const n = from.filter((f) => !f.startsWith("nav:")).length;
  return nav ? `${n} + nav` : String(n);
};
const driftCell = (d) => {
  const total = d.palette + d.arbitraryColor + d.colorFn + d.inlineStyle;
  return total === 0 && d.rawControl === 0 ? "—" : `${total} / ${d.rawControl}`;
};

const md = [];
md.push("# Route inventory (generated)");
md.push("");
md.push("<!-- Generated by frontend/scripts/route-inventory.mjs. Do not edit by hand: run `npm run routes` in frontend/. -->");
md.push("");
md.push("The hand-written companion with descriptions and the reorganization proposal is [site-map.md](./site-map.md).");
md.push("Static analysis only, so treat every column as a lead: fetches and links built from variables are invisible to it.");
md.push("");
md.push(`**${pages.length} pages · ${apiRoutes.length} API route files** · middleware login gate: ${cell(protectedPrefixes)}`);
md.push("");
md.push("## Pages");
md.push("");
md.push("Columns:");
md.push("- **Auth**: `middleware` means a login redirect from a `PROTECTED_PREFIXES` entry; `page-redirect` means the page itself redirects to `/login`.");
md.push("- **DB**: `direct` means the page's imports reach `src/lib/db.ts`; `via-api` means it calls a DB-backed `/api` route.");
md.push("- **Demo**: `gated` means the page reads `DEMO_MODE`; `partial` means a component it renders does.");
md.push("- **API calls**: distinct `/api` routes named in the page's own UI code (fetches, helper calls and download links). Layout fetches, such as the BottomNav unread badge, are excluded.");
md.push("- **Linked from**: pages linking here, plus `nav` when a layout links here (BottomNav).");
md.push("- **Drift**: *hard-coded colours / raw form controls*, counted outside `src/components/ui`.");
md.push("");
md.push("| Page | Group | Render | Auth | DB | Demo | API calls | Linked from | Drift | Tests |");
md.push("|---|---|---|---|---|---|---|---|---|---|");
for (const p of pages) {
  md.push(
    `| \`${p.url}\` | ${p.group} | ${p.render} | ${p.auth} | ${p.db} | ${p.demoMode || "—"} | ${p.apiCalls.length} | ${linkedCell(p.linkedFrom)} | ${driftCell(p.drift)} | ${short(p.tests)} |`,
  );
}
md.push("");

const frontendOnly = pages.filter((p) => p.db === "none");
md.push("## Frontend-only pages (no DB, directly or via `/api`)");
md.push("");
md.push(frontendOnly.length ? frontendOnly.map((p) => `- \`${p.url}\``).join("\n") : "None.");
md.push("");

const orphans = pages.filter((p) => p.linkedFrom.length === 0 && p.url !== "/");
md.push("## Pages nothing links to");
md.push("");
md.push("Reached only by typed URL, QR code, redirect, or a link this scan cannot see.");
md.push("");
md.push(orphans.map((p) => `- \`${p.url}\``).join("\n") || "None.");
md.push("");

const withDead = pages.filter((p) => p.deadLinks.length);
md.push("## Dead or suspicious links");
md.push("");
md.push(withDead.length ? withDead.map((p) => `- \`${p.url}\`: ${p.deadLinks.map((d) => `\`${d}\``).join(", ")}`).join("\n") : "None.");
md.push("");

const unresolved = pages.filter((p) => p.unresolvedFetches.length);
md.push("## API references that match no API route");
md.push("");
md.push(unresolved.length ? unresolved.map((p) => `- \`${p.url}\`: ${p.unresolvedFetches.map((d) => `\`${d}\``).join(", ")}`).join("\n") : "None.");
md.push("");

md.push("## API routes");
md.push("");
md.push("Columns:");
md.push("- **Auth**: read from the route file:");
md.push("  - `session`: reads the session cookie (required or optional; the route decides).");
md.push("  - `signs-in`: creates a session.");
md.push("  - `url-token`: a capability token in the URL.");
md.push("  - `client-credentials`: the agency API headers.");
md.push("  - `public`: none of the above.");
md.push("- **Called from**: pages whose UI code fetches the route; `nav:` means a layout does.");
md.push("");
md.push("| Route | Methods | DB | Auth | Demo-gated | Rate-limited | Called from | Tests |");
md.push("|---|---|---|---|---|---|---|---|");
for (const a of apiRoutes) {
  md.push(
    `| \`${a.url}\` | ${a.methods.join(", ")} | ${a.db ? "yes" : "no"} | ${a.auth} | ${a.demoGated ? "yes" : "—"} | ${a.rateLimited ? "yes" : "—"} | ${a.calledFrom.length ? cell(a.calledFrom) : "—"} | ${short(a.tests)} |`,
  );
}
md.push("");

const uncalled = apiRoutes.filter((a) => a.calledFrom.length === 0);
md.push("## API routes no page calls");
md.push("");
md.push("Expected for downloads, redirects, external clients and form posts. Anything else is a candidate for removal or a missing UI.");
md.push("");
md.push(uncalled.map((a) => `- \`${a.url}\``).join("\n"));
md.push("");

const outputs = [
  [OUT_JSON, json],
  [OUT_MD, md.join("\n")],
];

if (process.argv.includes("--check")) {
  const stale = outputs.filter(([file, body]) => !existsSync(file) || read(file) !== body).map(([file]) => rel(file));
  if (stale.length) {
    console.error(`[routes] Out of date: ${stale.join(", ")}. Run \`npm run routes\` in frontend/.`);
    process.exit(1);
  }
  console.log("[routes] Inventory is up to date.");
} else {
  for (const [file, body] of outputs) writeFileSync(file, body);
  console.log(`[routes] ${pages.length} pages, ${apiRoutes.length} API routes → ${rel(OUT_MD)}, ${rel(OUT_JSON)}`);
}
