# FutureMail

Nuxt 4 + @nuxt/ui v4 single-page app with a Nitro backend (better-auth + drizzle). Uses Bun as package manager and Tailwind CSS v4.

## Commands

- `bun install` — install dependencies
- `bun run dev` — dev server on http://localhost:3000
- `bun run build` — production build
- `bun run preview` — preview production build
- `bun run test` — bun test
- `bun run typecheck` — nuxt typecheck
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
- `server/db/` — drizzle schema (`schema.ts`, `auth-schema.ts`) + migrations
- `server/auth.ts` — better-auth with magic link
- `server/api/` — auth catch-all, `POST /api/emails`, `GET /api/emails`
- `server/services/email/` — email providers (resend, smtp, console)
- `server/services/claim.ts` — email claim logic
- `server/plugins/db.ts` — db client plugin
- `dispatcher/index.ts` — standalone poller (`bun run dispatcher`)

## Key conventions

- Uses Nuxt 4 source dir (`app/`), not the Nuxt 3 root-level layout
- Neobrutalist design system in `app/assets/css/main.css`: `@theme` tokens (`bg-paper`, `text-ink`, `bg-nb-*`) and component classes (`nb-card`, `nb-btn`, `nb-input`, `nb-badge`, `nb-sticker`, `nb-track`)
- Fonts: Archivo Black (display) + Space Grotesk (body) via nuxt.config
- `@nuxt/ui` v4 is still available, but the UI is mostly custom CSS classes
- Auto-imports enabled (Nuxt default): `ref`, `computed`, etc. need no explicit imports
- Tailwind v4 (CSS-first config via `@import "tailwindcss"` in main.css)

## Gotchas

- `postinstall` script runs `nuxt prepare` — required after cloning to generate `.nuxt/` types
- `tsconfig.json` references generated configs in `.nuxt/` — must exist before TypeScript works
- `bun.lock` present: use `bun`, not npm/yarn, for dependency management
- drizzle-orm is v1 rc — use `drizzle({ client })` signature, no `relations()` export
- TypeScript pinned to 5.9.x (TS 7 breaks vue-tsc)
- In-transit emails (status pending/sending) must never expose subject/body through the API
