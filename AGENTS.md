# FutureMail

Nuxt 4 + @nuxt/ui v4 single-page app with a Nitro backend (better-auth + drizzle). Uses Bun as package manager and Tailwind CSS v4.

## Agent rules

- **Never enter a rabbit hole.** If you are confused, or the next step is not obvious, stop and ask the user. Do not keep digging.
- Do not deep-dive installed tools, binaries, or library internals unless the user explicitly asks.
- Investigate only what the task requires; if a detour is needed, ask first.

## Commands

- `bun install` — install dependencies
- `bun run dev` — dev server on http://localhost:3000
- `bun run build` — production build
- `bun run preview` — preview production build
- `bun run test` — bun test
- `bun run typecheck` — nuxt typecheck
- `bun run db:push` — apply `schema.ts` directly to the dev DB (prototyping; no migration files)
- `bun run dispatcher` — standalone email dispatcher poller

## Structure

- `app/` — source root (Nuxt 4 convention; pages, components, layouts, assets live here, not at project root)
- `app/app.vue` — root component, wraps `<NuxtPage>` in `<UApp>`
- `app/pages/index.vue` — the only page (index route)
- `app/components/` — `AppHeader`, `SignInCard`, `ComposeCard`, `TransitBoard`, `TransitCard`
- `app/composables/useNow.ts` — reactive clock composable
- `app/types/email.ts` — shared email types
- `app/utils/` — `date.ts`, `error.ts` helpers
- `nuxt.config.ts` — `@nuxt/ui` module, Google fonts (Archivo Black + Space Grotesk)

## Backend

- `server/` — Nitro backend
- `server/db/` — drizzle schema (`schema.ts`, `auth-schema.ts`); migrations are paused during prototyping
- `server/auth.ts` — better-auth with emailed OTP (no magic link)
- `server/api/` — auth catch-all, `POST /api/emails`, `GET /api/emails`
- `server/services/email/` — email providers (resend, smtp, console)
- `server/services/claim.ts` — email claim logic
- `server/plugins/db.ts` — initializes the db (WAL + foreign keys) on boot; automatic migrations are commented out during prototyping
- `dispatcher/index.ts` — standalone poller (`bun run dispatcher`)

## Key conventions

- Uses Nuxt 4 source dir (`app/`), not the Nuxt 3 root-level layout
- Neobrutalist design system in `app/assets/css/main.css`: `@theme` tokens (`bg-paper`, `text-ink`, `bg-nb-*`) and component classes (`nb-card`, `nb-btn`, `nb-input`, `nb-badge`, `nb-sticker`, `nb-track`)
- Fonts: Archivo Black (display) + Space Grotesk (body) via nuxt.config
- `@nuxt/ui` v4 is still available, but the UI is mostly custom CSS classes
- Auto-imports enabled (Nuxt default): `ref`, `computed`, etc. need no explicit imports
- Tailwind v4 (CSS-first config via `@import "tailwindcss"` in main.css)
- **Email encryption uses the WebCrypto API with AES-GCM** — when a user opts to encrypt their email, encrypt and decrypt with the browser's `crypto.subtle` (AES-GCM), not a third-party crypto library. Never send plaintext subject/body for encrypted emails.

## UI verification and browser tools

- **Use agent-browser—not terminal-browser—for automated UI verification inside herdr.** Agent-browser is genuinely headless and does not take over terminal panes or input. Pass `--headed false` explicitly so a user config cannot make it visible.
- `agent-browser` is not on `PATH`; use the binary bundled with terminal-browser. Chrome is installed and this headless setup has been verified:

  ```bash
  AB="$HOME/.local/share/terminal-browser/app/agent-browser/bin/agent-browser"
  "$AB" --session futuremail-ui-check --headed false open http://localhost:3000
  "$AB" --session futuremail-ui-check snapshot
  "$AB" --session futuremail-ui-check close
  ```

  Use a task-unique session name consistently across commands and close that session when finished. If agent-browser reports that Chrome is missing, run `"$AB" install` first; if installation fails, report visual verification as unverified or ask the user.
- Only launch terminal-browser when the user explicitly requests a visible browser. Never run `terminal-browser open`, `terminal-browser new-tab`, or `terminal-browser ... --split ...` merely to verify UI, and never fall back to a foreground terminal-browser session when agent-browser fails.

## Gotchas

- `postinstall` script runs `nuxt prepare` — required after cloning to generate `.nuxt/` types
- `tsconfig.json` references generated configs in `.nuxt/` — must exist before TypeScript works
- `bun.lock` present: use `bun`, not npm/yarn, for dependency management
- drizzle-orm is v1 rc — use `drizzle({ client })` signature, no `relations()` export
- TypeScript pinned to 5.9.x (TS 7 breaks vue-tsc)
- In-transit emails (status pending/sending) must never expose subject/body through the API
- **DB schema is in a prototyping phase — migrations are intentionally paused.** After any `schema.ts` change run `bun run db:push`; do NOT run `db:generate`/`db:migrate`, and leave `DB_AUTO_MIGRATE` unset. `runMigrations()` in `server/db/index.ts` and its call sites in `server/plugins/db.ts` and `dispatcher/index.ts` are commented out. `server/services/claim.test.ts` builds its throwaway DB with `bunx drizzle-kit push --force`. **When the schema stabilizes:** uncomment those blocks (re-import `autoMigrateEnabled`/`runMigrations`), run `bun run db:generate` to create one baseline migration, commit it, then set `DB_AUTO_MIGRATE=true` (or run `bun run db:migrate`) for production.
