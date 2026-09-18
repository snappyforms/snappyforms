---
name: app-tour
description: Record a short video tour (screencast/demo/walkthrough) of the SnappyForms app for partners or the team, using a shot-scraper storyboard. Use when asked to record a tour, demo video, screencast, or "show how X works" as video, or to edit an existing storyboard in frontend/e2e/tours/.
---

# Recording an app tour

A tour is a **storyboard**: one YAML file declaring a routine, which
[shot-scraper](https://shot-scraper.datasette.io/en/stable/video.html) plays
through Playwright while recording WebM + MP4. The YAML is the source; the video
is build output. Storyboards live in `frontend/e2e/tours/`.

`frontend/e2e/tours/maya-confirmation.storyboard.yml` is the worked example —
read it before writing a new one.

## 1. Get the schema from the tool, not from memory

```bash
uvx shot-scraper video --help
```

That output is the authoritative reference for every top-level key and every
action. Do not guess key names: the storyboard model sets `extra="forbid"`, so a
misspelled key is a hard validation error rather than a silently ignored one.

The shape, in brief: top-level `output`, `url`, `viewport`, `cursor`, `wait_for`,
then `scenes:` — each with a `name`, optional `open:`/`wait_for:`, and a `do:`
list of actions (`click`, `type`, `fill`, `press`, `scroll`, `pause`,
`wait_for`, `wait_for_url`, `open`, `screenshot`, `js`).

## 2. Steal the selectors — never invent them

**Every selector must come from a story script that already passes** against the
app:

- `frontend/e2e/maya-confirmation-story.mjs` — participant requests
  confirmation, org confirms, PA 1895, fax
- `frontend/e2e/shift-qr-story.mjs` — rotating-QR shift check-in
- `frontend/e2e/demo-stories.mjs` — guest participant + authorizer

Those scripts assert on what they click, so when the UI moves, they fail loudly
and tell you what changed. A storyboard has no assertions — it just records
whatever happens. So: **fix the `.mjs` story first, then copy the selector
across.** If a flow has no story script, write or extend one before recording it.

Translating Playwright JS to storyboard selector strings:

| In the `.mjs` story | In the storyboard |
| --- | --- |
| `getByRole("link", {name: /Explore the Demo/i})` | `a:has-text("Explore the Demo")` |
| `getByRole("tab", {name: /^Confirmed$/i})` | `role=tab[name="Confirmed"i]` |
| `getByPlaceholder(/Search handles/i)` | `input[placeholder*="Search handles"]` |
| `getByTestId("send-fax")` | `[data-testid="send-fax"]` |
| `.first()` / `.last()` | `>> nth=0` / `>> nth=-1` |
| `.check()` on a checkbox | `click` on it |

Locators are **strict**: a selector matching two elements fails the recording.
Add `>> nth=0` wherever the `.mjs` used `.first()`. Use `:has-text()` where the
JS used a loose regex (substring), `role=...[name="X"i]` where it was anchored
(`/^X$/`).

## 3. House style

- **Phone-shaped**: `viewport: {width: 390, height: 844}`. That is how
  participants actually use this app.
- **Tap, not pointer**: `cursor: {visible: false, clicks: true, click_size: 60}`
  — suppresses the mouse dot but keeps the click ring, so interactions read as
  finger taps. shot-scraper has no true touch emulation; see
  `docs/spikes/41-app-tours.md` for exactly what that does and does not buy.
- **One scene per narrative beat**, named as a sentence about the person
  (`Northside confirms the record`), not the mechanics.
- **`pause: 1-2` after each beat lands**, `pause: 2-3` on the payoff frame.
  Without pauses the tour is unwatchably fast.
- **`type:` with `delay_ms` for anything the viewer should read** being typed
  (search terms, titles); `fill:` for everything else.
- **`screenshot:` the beats worth a still** — those stills are reusable in decks
  and in the README. Put a `pause: 0.5` *before* the screenshot if it follows a
  click: the tap ring animates over 650ms, so an immediate still catches it at
  quarter size and nearly transparent.
- **Never hardcode a date.** Add a `${PLACEHOLDER}` and substitute it in
  `frontend/docker/entrypoint-tour.sh` (that is why `${ACTIVITY_DATE}` exists:
  the PA 1895 covers one Sunday-Saturday week, so a fixed date rots).

## 4. Validate before recording

Recording needs the whole stack up; parsing does not. Check the YAML against
shot-scraper's own model first — it catches every typo'd key in a second:

```bash
python3 -c "
import yaml; from shot_scraper.video import Storyboard
src = open('frontend/e2e/tours/maya-confirmation.storyboard.yml').read()
Storyboard.model_validate(yaml.safe_load(src.replace('\${BASE_URL}','http://webapp:3000').replace('\${ACTIVITY_DATE}','2026-01-01')))
print('valid')"
```

## 5. Record it

From the **repo root** (`docker-compose.yml` lives there, not in `frontend/`):

```bash
docker compose down -v                                   # forces a reseed
docker compose up --build --exit-code-from tour tour
```

- `down -v` is not optional: `entrypoint-app.sh` only seeds when the user count
  is 0, and the storyboard uses a fixed activity title, so a warm database
  stacks duplicate records and the queue scene picks the wrong one.
- `--build` is required after **any** storyboard edit — `Dockerfile.video`
  copies `e2e/tours` into the image rather than mounting it.
- Output: `frontend/e2e/tours/output/*.mp4` (committed), plus `.webm` and stills
  (gitignored).
- Requires `DEMO_MODE=true` and build-time `NEXT_PUBLIC_DEMO_MODE=true`, both
  already set on the compose `webapp` service. No `--auth` file is needed —
  in demo mode the persona picker signs you in with one click.

Record a different storyboard with `STORYBOARD=my-tour.storyboard.yml docker compose up --build tour`,
or point at a deployed demo with `BASE_URL=https://...`.

## 6. Watch it before you ship it

Recordings fail quietly — a missed `wait_for` gives you a video of a spinner. So
watch the MP4 end to end and check: every beat is on screen long enough to read,
the tap rings land on the control being pressed, no half-rendered frames, and
the mobile layout did not hide a control the tour needed (if it did, either add
the step that opens the nav, or fall back to `viewport: {width: 1280, height: 720}`).
