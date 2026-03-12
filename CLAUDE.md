# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on port 3434
npm run build        # Production build
npm run lint         # ESLint via Next.js
npm run storybook    # Storybook dev on port 6006

# Run tests
npm test                                    # Unit tests (CI/CD)
npx vitest run --project storybook          # Storybook snapshot tests (Playwright)
npx vitest run --project unit lib/blog      # Single test file
```

## Architecture

**Next.js 14 App Router** personal website with file-based content, no database, no CMS.

### Content System
- **Blog posts**: `content/blog/*.mdx` with YAML frontmatter (`title`, `date`, `slug`, `excerpt`)
- **AWS exam questions**: `content/aws/saa/question-sets/*.json` imported as typed data
- `lib/blog.ts` reads/caches posts; `getAllPosts()` and `getPostBySlug()` are the main APIs
- Blog pages use `export const dynamic = 'force-static'`; prices page uses `revalidate = 86400` (ISR)

### Key Data Flows
- **Blog**: `getAllPosts()` → sort by date → render MDX server-side via `compileMDX()` with custom `MDXComponents`
- **Prices**: `getDailyCommodityPrices()` → `Promise.allSettled([fetchGold, fetchEnergy, fetchFood])` → Alpha Vantage + FRED APIs with fallback data
- **AWS Exam**: JSON imported in `lib/aws-saa.ts` → rendered client-side in `PracticeExamPage.tsx` with timer, flagging, scoring

### Theme System
- Default: dark theme. Light mode via `html[data-theme='light']`
- CSS custom properties (`--site-*`) defined in `app/globals.css`
- `ThemeProvider` context syncs with `localStorage` and sets `document.documentElement.dataset.theme`
- Tailwind uses CSS variables: e.g. `text-[color:var(--site-text)]`

### MDX Components
All custom MDX elements registered in `components/mdx/MDXComponents.tsx`. Available components: `Callout`, `Steps`, `Stat`, `Compare`, `Flow`, `QuoteBlock`, `ImageFigure`, `BackgroundImageSection`, `YouTubeEmbed`, `SectionBreak`.

### Path Alias
`@/*` maps to the project root (configured in `tsconfig.json` and `vitest.config.ts`).

## Constraints (from PLAN.md)

- **No UI libraries** (Radix, shadcn, etc.) — custom Tailwind components only
- **No state management libraries** — React hooks/context only
- **No new dependencies** without strong justification
- **File-based content only** — no CMS, no database, no auth
- **Minimal abstraction** — explicit composition over flexibility
- **Subtle motion only** — Framer Motion for presence/transition, not spectacle
- **Rounded corners**: `rounded-sm` at most
- Design is typography-first, calm, spacious, dark-by-default

## Environment Variables

```
ALPHA_VANTAGE_API_KEY   # Commodity price data
FRED_API_KEY            # Federal Reserve economic data
```

Copy `.env.example` to `.env.local` for local development.
