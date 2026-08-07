---
name: visual-check
description: Visually verify UI/frontend changes on the real running Nompaw app by taking real screenshots with Playwright in a throwaway Docker container, since the project's own node container (Alpine/musl) can't run Chromium and no browser tool is otherwise available. Use this after any React/Twig/CSS change before claiming the UI works — a `yarn build` that compiles is not proof the page renders or behaves correctly.
---

# Visual check via throwaway Playwright container

The project's `node` container is Alpine-based (musl), which cannot run Playwright's
Chromium (glibc-only). This skill uses a separate, disposable, official Playwright
Docker image joined to the app's Docker network to screenshot the **real running
app** — not a mockup — after login as a temporary test user seeded directly in the
database.

Always follow the full procedure, including cleanup at the end. Do not skip cleanup:
the test fixtures are created in the **real** `nompaw` database (the one `nginx`
actually serves), not `nompaw_test`.

## Procedure

### 1. Make sure assets are built

```
make yarn-build   # or ensure `yarn watch` (node container) has already recompiled
```

### 2. Seed a temporary test user + fixtures directly in the real DB

Use `docker-compose exec php php bin/console dbal:run-sql "..."` for every
read/write (don't try `mysql` client — it isn't installed in the db container).
Note: `dbal:run-sql` silently no-ops for bare read statements like `DESCRIBE`/`SHOW
CREATE TABLE` (routed through the write path, prints "N rows affected" instead of
results) — use `information_schema` SELECTs instead if you need that.

Generate a password hash:

```
docker-compose exec php php bin/console security:hash-password 'SomeTestPassword123!' 'App\Entity\Main\User'
```

Then insert a `Society` + a `User` (`ROLE_USER`, the hash above) + whatever
domain fixtures the page under test needs (e.g. for budget: `bu_category`,
`bu_recurrent`, `bu_item` rows). Keep every inserted row's ID/criteria noted —
you will delete them all in step 5.

Pick an obviously-fake username (e.g. `playwright-visual-check`) and a
recognizable society code (e.g. `pw-check`) so the fixtures are unambiguous
to find and delete later, and so they'd never be mistaken for real user data
if cleanup were somehow interrupted.

### 3. Write a Playwright script

Copy `template.js` (next to this file) into the session scratchpad directory and
adapt the login step, target URL(s), and the list of interactions/screenshots to
the feature being checked. Key points already baked into the template:

- `BASE = 'http://nginx'` — the app is reached by Docker service name, not localhost.
- Login form is `/connexion` with `#username` / `#password` fields and a
  `button[type="submit"]`.
- Output must be written under the **mounted** volume path (`/work/...`), not
  some other in-container path — otherwise screenshots vanish silently when the
  throwaway container is removed (`--rm`), with no error, just nothing on disk.
- `page.waitForTimeout(...)` after navigation/clicks to let React hydrate and
  finish rendering (network-idle alone isn't enough for client-rendered charts/lists).

### 4. Run it in a throwaway Playwright container on the app's network

```
docker run --rm --network nompaw_symfony \
  -v "<scratchpad>:/work" -w /work \
  mcr.microsoft.com/playwright:v1.48.0-jammy \
  node visual_check.js
```

First run in a session: playwright's npm package needs to exist in `/work/node_modules`
(the browsers are already baked into this image, so skip the download):

```
docker run --rm -v "<scratchpad>:/work" -w /work mcr.microsoft.com/playwright:v1.48.0-jammy \
  bash -c "npm init -y && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install playwright@1.48.0"
```

### 5. Read the screenshots and actually look at them

Use the Read tool on each PNG. Don't assume — check spacing, whether elements
overlap, whether interactive state (tabs, sheets, dialogs) behaves as expected
across multiple screenshots (before/after an interaction), and colors/badges
match what was intended.

### 6. Clean up the test fixtures — mandatory, do this every time

Delete in FK-safe order (children before parents), e.g.:

```
docker-compose exec -T php php bin/console dbal:run-sql "DELETE FROM bu_item WHERE user_id=<id>"
docker-compose exec -T php php bin/console dbal:run-sql "DELETE FROM bu_recurrent WHERE user_id=<id>"
docker-compose exec -T php php bin/console dbal:run-sql "DELETE FROM bu_category WHERE user_id=<id>"
docker-compose exec -T php php bin/console dbal:run-sql "DELETE FROM user WHERE id=<id>"
docker-compose exec -T php php bin/console dbal:run-sql "DELETE FROM society WHERE id=<id>"
```

Verify afterwards with a `SELECT COUNT(*) ... WHERE id=<id>` returning 0 for the
user and society rows.

## Gotchas already hit

- **Screenshots silently missing**: caused by writing to an unmounted path inside
  the throwaway container. The script prints "DONE" with no error either way —
  always double check the output directory is a subpath of the `-v` mount.
- **`dbal:run-sql` on non-SELECT-prefixed read statements** (`DESCRIBE`, `SHOW
  CREATE TABLE`) silently no-ops instead of erroring — use `information_schema`
  queries instead.
- Numbers shown in the UI (balances, totals) are worth sanity-checking by hand
  against the seeded fixture values — this has caught real backend bugs before,
  not just visual ones.
