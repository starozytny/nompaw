# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Nompaw is a Symfony 6.4 (PHP 8.1) application with a React frontend built via Webpack Encore. It's a private family/group organizer covering several domains: hiking trips ("aventures"/"randos"), birthdays, shared budget, holiday planning, crypto trade tracking, a video library, a blog, and an admin back-office.

## Development environment

The project runs via Docker Compose (`docker-compose.yml`): `php` (app container), `nginx` (port 8080), `db_default` (MariaDB), and `node` (runs `yarn watch` continuously). Common tasks are wrapped in the `makefile`:

```
make install       # build + up + composer + yarn + db-create + migrate (first-time setup)
make up / make down / make restart
make composer       # composer install inside php container
make yarn           # yarn install inside node container
make yarn-build     # production asset build
make yarn-watch     # dev asset watch
make db-create / make db-drop
make db-make-migrate     # generate a new migration (doctrine make:migration)
make db-migrate          # run pending migrations
make cache-clear
make logs / make logs-php / make logs-nginx
```

All `make` targets run commands inside the containers via `docker-compose exec`. If working outside Docker, replace `docker-compose exec php ...` with a direct `php ...` invocation (requires PHP 8.1+ locally, matching `.php-version`).

### Tests

```
make init_test_db     # php bin/console --env=test do:sc:up -f
make check_test       # loads fixtures then runs: symfony php bin/phpunit
```
`.env.test` configures the test kernel. Note: as of now `tests/` only contains `bootstrap.php` — no test cases exist yet. To run a single test once tests are added: `symfony php bin/phpunit --filter TestName path/to/TestFile.php` (or `php bin/phpunit ...` if not using the Symfony CLI wrapper).

### Frontend build

```
yarn dev-server   # encore dev-server
yarn dev          # encore dev (one-off build)
yarn watch        # encore dev --watch
yarn build        # encore production --progress
```

### Routing

`make route` dumps Symfony routes marked `expose: true` to `public/js/fos_js_routes.json` for use by the JS `Routing` helper (FOSJsRoutingBundle). Re-run this after adding/renaming an exposed route.

## Architecture

### Multi-tenancy: one database per Society

`App\Entity\Main\Society` represents a client/organization. `App\Service\MultipleDatabase\MultipleDatabase` provisions a **dedicated MariaDB database per Society** at runtime: it appends a `DATABASE_URL_CLIENT_<code>` entry to the env file and writes a matching Doctrine connection/entity-manager block into `config/packages/doctrine.yaml`. Related commands live in `src/Command/MultipleDatabase/`. Keep this in mind when touching Doctrine config or anything that assumes a single global connection — most domain data is scoped per-society, not global.

### Controller layering (`src/Controller/`)

Controllers are split by audience/purpose, and this determines both the URL prefix and the applicable firewall (see `config/packages/security.yaml`):

- `User/**` — page controllers for logged-in members, prefix `/espace-membre`, render Twig templates (`ROLE_USER`, session/form_login).
- `InternApi/**` — JSON endpoints consumed by the React components embedded in those pages, prefix `/intern/api` (`ROLE_USER`, AJAX, same session).
- `Api/**` — public-facing JWT API, prefix `/api` (`jwt: ~` firewall, stateless). Login happens at `/api/login_check` via `json_login` + Lexik JWT.
- `Admin/**` + `AdminController` — back-office, prefix `/admin` (`ROLE_ADMIN`).
- `ThirdParty/**` — OAuth callback endpoints (Google/Facebook) handled by `src/Security/GoogleAuthenticator.php` and `FacebookAuthenticator.php`.

Routes are attribute-based (`#[Route(...)]`) and auto-loaded from `src/Controller/` (see `config/routes.yaml`). Routes meant to be called from JS must add `options: ['expose' => true]` so they're included in the FOS JS routing dump.

### Entity/domain naming

Entities live under `src/Entity/<Domain>/` with a short prefix matching the domain, e.g. `Bi*` = Birthday, `Bu*` = Budget, `Ho*` = Holiday, `Ra*` = Rando/Aventures, `Vi*` = Video, `Cr*` = Crypto. `src/Repository/` and `src/Entity/Enum/` mirror the same domain subdirectories. Most domain entities extend `App\Entity\DataEntity` (helpers for default file/image fallback paths and a shared symmetric-encrypt/decrypt helper used for sensitive fields like crypto credentials).

### Request → entity data flow

React forms POST JSON to `InternApi` controllers. The controller decodes the payload and delegates filling the entity to a `Service\Data\Data*` service (one per domain, e.g. `DataRandos`, `DataBudget`), then validates via `ValidatorService`, then persists via the repository's `save()`. Responses are built with `Service\Api\ApiResponse`, which standardizes JSON shapes (`apiJsonResponseData`, `apiJsonResponseBadRequest`, `apiJsonResponseValidationFailed`, `apiJsonResponseForbidden`, etc.) — reuse these rather than constructing `JsonResponse` ad hoc in new `InternApi`/`Api` controllers.

### Frontend structure and the hydration pattern

Assets are organized by section under `assets/`: `app/` (public site), `user/` (member area), `admin/` (back-office), `common/` (shared JS/CSS across sections), `theme/tailwind/` and `theme/shadcn/` (Tailwind config/base styles and shadcn/ui components).

Each section has its own Webpack Encore entries (see `webpack.config.js`), one per page, e.g. `user_aventures` → `assets/user/js/pages/aventures.js`. Pages are not a single SPA: Twig renders the page shell and drops React mount points as plain elements with an `id` and `data-*` attributes carrying server data as JSON; the corresponding entry script looks up each `id` with `document.getElementById(...)`, `JSON.parse`s the `data-*` props, and calls `createRoot(el).render(<Component ... />)`. Follow this same pattern (id lookup + `data-*` JSON props) when wiring a new React component into a Twig page rather than introducing a different mounting convention.

Import aliases (defined in both `webpack.config.js` and `jsconfig.json`, keep them in sync) include `@commonFolder`, `@commonFunctions`, `@commonHooks`, `@appFolder`, `@adminPages`, `@userPages`, `@userFunctions`, `@tailwindFolder`/`@tailwindComponents`/`@tailwindFunctions`, `@shadcnComponents`, `@publicFolder`. `tsconfig.json` additionally defines `@/*` → project root for shadcn tooling. `components.json` configures the shadcn CLI (components live under `assets/theme/shadcn/js/components`, aliased as `@shadcnComponents`).

### Security

- `main` firewall: form login (`app_login`/`app_logout`), CSRF-protected, plus custom OAuth authenticators for Google and Facebook (`src/Security/`), backed by `App\EventListener\SecurityListener`.
- `api` firewall: stateless JWT (Lexik bundle); obtain a token via `POST /api/login_check`.
- Role hierarchy: `ROLE_ADMIN` implies `ROLE_USER`; `ROLE_DEVELOPER` implies `ROLE_ADMIN` + switch-user.
- `access_control` in `config/packages/security.yaml` is the source of truth for which prefixes require which role — check it before assuming a new route's access level.

### Other services worth knowing about

- `Service/StorageService.php`, `Service/FileUploader.php` — file/image upload handling (uploaded content lives under `public/` subfolders like `public/avatars`, `public/societies`, `public/placeholders`).
- `Service/Export.php` — spreadsheet export (PhpSpreadsheet).
- `Service/MailerService.php` + `templates/app/email/**` — transactional email templates.
- `Service/SettingsService.php` / `Entity/Main/Settings.php` — per-installation settings.
- `documents/` — generated/user-facing document output (emails, exports, storytelling, videotheque), not source code.
