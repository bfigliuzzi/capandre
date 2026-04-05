# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Capandre — boîte à outils numérique offline-first pour les enfants d'école élémentaire en France (dictées, poésies, futur : tables de multiplication, conjugaison, grammaire).

## Language

All generated content (specs, documentation, reports, mockups) MUST be written in **French**.
Technical terms, variable names, code, file paths, and architectural pattern names remain in English.

## Commands

```bash
pnpm dev          # Dev server (WATCHPACK_POLLING=true)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm exec vitest run              # Run all tests
pnpm exec vitest run lib/__tests__/parsing.test.ts  # Single test file
pnpm exec vitest --watch          # Watch mode
npx tsc --noEmit                  # Type check
```

## Architecture

**Next.js 16** App Router with React 19, TypeScript, Tailwind CSS 4, Base UI + shadcn (base-nova style).

**WARNING:** Next.js 16 has breaking changes vs training data. Read `node_modules/next/dist/docs/` before writing new Next.js code. Heed deprecation notices.

### Routing

```text
app/layout.tsx              # Root layout (lang="fr", fonts, skip link)
app/(app)/layout.tsx        # App layout (client — DB init, AppShell)
app/(app)/page.tsx          # Home
app/(app)/dictee/            # Dictée module (list, new, [id], [id]/edit, [id]/correction)
app/(app)/poesie/            # Poésie module (list, new, [id], [id]/edit)
```

All page components are `"use client"` — they use `useSetHeader()` to configure the header title and back link.

### Component Layers

- `components/ui/` — Base UI / shadcn primitives (Button, Input, Textarea, Sidebar, Sheet, AlertDialog…)
- `components/layout/` — App shell (AppShell, AppHeader, AppSidebar, HeaderContext)
- `components/` — Domain components (DictationForm, PoemForm, ContentItem, DifficultySelector, WordPreview, StanzaPreview…)

### Database (IndexedDB via `idb`)

```text
lib/db/schema.ts      # Types: Module, Level, Dictation, Poem, Word, Verse, Stanza
lib/db/database.ts    # getDB() singleton, versioned migrations (v3)
lib/db/operations.ts  # CRUD: getAll, getAllByIndex, getById, create, update, remove
lib/db/hooks.ts       # React hooks: useDictations, usePoems, useDictation, usePoem, useDictationMutations, usePoemMutations, useHasContent
lib/db/seed.ts        # Initial data seeding
```

Stores: `modules`, `levels`, `dictations`, `poems`. All indexed by `by-module`.

### Parsing (`lib/parsing.ts`)

- `parseWords(text)` — splits by **comma/newline only** (not spaces), lowercases. "le coq, les oies" → `["le coq", "les oies"]`
- `stripArticle(entry)` — removes French articles (le, la, l', les, un, une, des, du, de la, de l') for duplicate comparison
- `findDuplicates(words, normalize?)` — detects duplicates with optional normalizer, marks **all** occurrences
- `parseFullText(text)` — splits by French punctuation/spaces (for dictée "text" mode)
- `parseStanzas(text)` — splits poems into stanzas by double newline

### View Transitions

Enabled via `next.config.ts` (`experimental.viewTransition`). CSS recipes in `app/globals.css`. `<PageTransition>` wraps page content — directional slides for hierarchical nav (`transitionTypes={["nav-forward"]}`), no animation for lateral nav.

## Styling

Tailwind 4 with `@theme inline` in `app/globals.css`. Colors use oklch. Dark mode via `.dark` class. Design tokens spec: `docs/design-tokens.css`.

**Typography rules:**

- Base text: 16px (`text-base`)
- Annotations/hints/meta only: 14px (`text-sm`)
- No `text-xs` anywhere in the codebase

**Form labels** use: `font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider`

## Accessibility (WCAG AA)

- All text ≥ 14px, body text ≥ 16px
- `aria-invalid` + `aria-describedby` + `role="alert"` on form errors
- Roving tabindex on radiogroups
- `role="status"` on spinners and dynamic banners
- `document.title` updated on navigation
- All AT-facing text in French

## Documentation

See README.md for the documentation index.

## Reference

- Mission: `docs/mission.md`
- Tech stack: `docs/tech-stack.md`
- Domain model: `docs/domain-model.md`
- Roadmap: `docs/roadmap.md`
- Backlog: `docs/backlog.md`
- Conventions: `docs/conventions.md`

@AGENTS.md
