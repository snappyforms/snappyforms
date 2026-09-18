# SPIKE #41 — Recording short app tours

**Issue:** [#41](https://github.com/snappyforms/snappyforms/issues/41) ·
**Status:** findings below; skill and POC storyboard landed.

Potential partners want to see how SnappyForms works without signing in. This
spike reviewed Simon Willison's approach, picked a tool, and shipped a
repeatable way to produce tours.

## AC 1 — the blog review

The post is [*Have your agent record video demos of its work with shot-scraper
video*](https://simonwillison.net/2026/Jun/30/shot-scraper-video/) (30 June
2026), shipping in [shot-scraper
1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10). Full reference:
[Recording videos](https://shot-scraper.datasette.io/en/stable/video.html).

`shot-scraper video storyboard.yml --mp4` reads a **storyboard** — a declarative
YAML file — plays it through Playwright, records WebM, and converts to MP4 with
ffmpeg. A storyboard has top-level `output`, `url`, `viewport`, `cursor`,
`wait_for`, optional setup (`server`, `sh`, `python`, `javascript`), then
`scenes:`, each a named beat with a `do:` list of actions: `click`, `type`,
`fill`, `press`, `scroll`, `pause`, `wait_for`, `wait_for_url`, `open`,
`screenshot`, `sh`, `python`, `js`.

Willison's own framing is the reason it suits us: the `--help` output "works kind
of like bundling a `SKILL.md` file directly inside the tool", so the skill we
write stays thin and does not rot as the tool moves.

### Why this over extending our own Playwright scripts

We already drive these flows in `frontend/e2e/*.mjs`, and Playwright can record
video directly via `recordVideo`. We chose shot-scraper anyway:

| | shot-scraper storyboard | `recordVideo` in our `.mjs` |
| --- | --- | --- |
| Format | declarative YAML, reviewable in a diff, editable by non-engineers | imperative JS |
| Cursor / clicks | drawn for free (dot + click rings) | invisible; you hand-roll an overlay |
| Stills | `screenshot:` per scene | already have it |
| New dependency | Python + shot-scraper in a new image | none |

The one thing we give up is assertions — a storyboard records whatever happens,
including a failure. That is why the skill mandates taking selectors from a
passing `.mjs` story rather than inventing them.

## Phone-touch fidelity — what we can and cannot do

Asked directly: *can the click visuals be phone touches?* **Partly.** From
shot-scraper 1.10/1.11 source:

- `StoryboardViewport`
  ([`shot_scraper/video.py:24-27`](https://github.com/simonw/shot-scraper/blob/1.10/shot_scraper/video.py))
  accepts `width` and `height` **only**, and the base model sets
  `extra="forbid"` — so `device`, `is_mobile`, `has_touch` and
  `device_scale_factor` are rejected outright. There is no `tap` action either,
  only `click`.
- The cursor overlay (`shot_scraper/cli.py`, `_storyboard_cursor_script`) injects
  a follower dot plus a `.shot-scraper-click-ring` that animates 650ms from
  `scale(0.25)` to `scale(1.25)` and fades.

So the tour gets:

- **the real mobile layout**, by setting a phone viewport (390×844) — responsive
  CSS keys off width, which is all our UI needs;
- **tap-looking interactions**, by setting `cursor: {visible: false, clicks:
  true}`. The dot is never created, but the ring still fires (it is gated on
  `clicks` alone), so each interaction is a ripple with no desktop pointer.

And does **not** get: real touch events, a mobile user-agent, 2× device pixel
ratio, or a phone bezel. If we ever need genuine touch fidelity — say a control
that branches on touch support — that means Playwright's `devices[...]` +
`page.tap()`, and hand-drawing the tap indicator ourselves. Not worth it yet.

## AC 2 — the skill

`.claude/skills/app-tour/SKILL.md` (the repo's first skill). It covers: reading
the schema from `--help` rather than memory, taking selectors from a passing
`.mjs` story with a JS→selector translation table, house style (phone viewport,
tap-only cursor, one scene per beat, pacing), validating the YAML without
standing up the stack, recording, and reviewing the cut.

## AC 3 — the POC

`frontend/e2e/tours/maya-confirmation.storyboard.yml` — the presentation
walkthrough from `frontend/e2e/maya-confirmation-story.mjs`, cut to four beats:
Maya requests confirmation → Northside confirms it → Maya sees it confirmed →
Maya fills the PA 1895 and faxes it. 11 scenes, 85 actions.

Recorded by a new `tour` compose service:

```bash
docker compose down -v
docker compose up --build --exit-code-from tour tour
```

New pieces: `frontend/docker/Dockerfile.video` (Python Playwright image +
shot-scraper; Chromium and ffmpeg already present),
`frontend/docker/entrypoint-tour.sh` (substitutes `${BASE_URL}` and
`${ACTIVITY_DATE}`, since shot-scraper has no templating or `--url` override),
and `npm run tour:maya`.

Two constraints worth knowing:

- **Record against a fresh stack.** The storyboard uses a fixed, legible
  activity title instead of the per-run unique one the `.mjs` story generates, so
  a warm database stacks duplicates and the queue scene becomes ambiguous.
  `entrypoint-app.sh` only seeds when the user count is 0, hence `down -v`.
- **`${ACTIVITY_DATE}` is computed, not written down.** The PA 1895 covers one
  Sunday–Saturday week; a hardcoded date would fall out of that week and quietly
  break the last beat.

## What was verified

- **The toolchain records.** A throwaway storyboard (390×844, tap-ring cursor)
  was recorded end to end with shot-scraper 1.11 and Chromium: WebM out, MP4 out
  (h264, 390×844), per-scene PNG out, tap ring landing on the tapped control with
  no pointer dot.
- **The MP4 step needs a real ffmpeg.** `--mp4` shells out to `ffmpeg` on PATH
  with `-movflags`, and the ffmpeg Playwright bundles is a stripped build that
  rejects it — you get `Unrecognized option 'movflags'`, a WebM, and no MP4.
  `Dockerfile.video` therefore installs ffmpeg from apt.
- **The Maya storyboard parses** against shot-scraper's own pydantic model
  (11 scenes, 85 actions), before and after placeholder substitution.

## Open

- The Maya storyboard has **not** been recorded against the running app — that
  needs a Docker host (this spike had no daemon and no Postgres). First run may
  need selector or viewport adjustment if the 390px mobile layout hides a
  control the tour clicks.
- If tours multiply, revisit committing MP4s to git (one per tour today).
- Two Playwright installs now exist: Node 1.61.1 (`Dockerfile.pw`) and Python
  1.61.0 (`Dockerfile.video`). They should move together.
