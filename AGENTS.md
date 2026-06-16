# FutureMail

Nuxt 4 + @nuxt/ui v4 single-page app. Uses Bun as package manager and Tailwind CSS v4.

## Commands

- `bun install` — install dependencies
- `bun run dev` — dev server on http://localhost:3000
- `bun run build` — production build
- `bun run preview` — preview production build

No test, lint, or typecheck commands are configured.

## Structure

- `app/` — source root (Nuxt 4 convention; pages, components, layouts, assets live here, not at project root)
- `app/app.vue` — root component, wraps `<NuxtPage>` in `<UApp>`
- `app/pages/home.vue` — the only page (index route)
- `app/components/` — `TheHeader`, `TheSidebar`, `TheFooter`
- `app/layouts/` — exists but empty
- `app/assets/css/main.css` — imports Tailwind + @nuxt/ui styles
- `nuxt.config.ts` — uses `@nuxt/ui` module, Google font (Inter)

## Key conventions

- Uses Nuxt 4 source dir (`app/`), not the Nuxt 3 root-level layout
- `@nuxt/ui` v4 components (`UApp`, `UHeader`, `USidebar`, `UFooter`, `UNavigationMenu`, `UTextarea`, `UButton`, `UColorModeButton`)
- Icons via `i-lucide-*` (Nuxt Icon module loaded by @nuxt/ui)
- Auto-imports enabled (Nuxt default): `ref`, `computed`, etc. need no explicit imports
- Tailwind v4 (CSS-first config via `@import "tailwindcss"` in main.css)

## Gotchas

- `postinstall` script runs `nuxt prepare` — required after cloning to generate `.nuxt/` types
- No typecheck script; run `nuxt typecheck` manually if needed
- `tsconfig.json` references generated configs in `.nuxt/` — must exist before TypeScript works
- `bun.lock` present: use `bun`, not npm/yarn, for dependency management