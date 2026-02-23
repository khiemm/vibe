# Personal Website — Architecture Plan

## 1. Purpose

This project is a personal website.
It exists to express mood, thoughts, and presence.
It is NOT a product, NOT a SaaS, NOT a dashboard.

Primary goal: calm, typography-first, quiet presence.

## 2. Scope

- Single-user
- No authentication
- No admin panel
- No dynamic backend logic
- File-based content only (see §7)

If a feature is not explicitly required, it should NOT be added.

Non-goals:

- comments, likes, search, RSS, analytics dashboards
- multi-language systems
- personalization, recommendation, user profiles
- complex data modeling

## 3. Tech Stack (Locked)

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (subtle animations only)
- next/font for typography
- Lucide Icons

The following are NOT allowed:

- UI libraries (Radix, shadcn, MUI, AntD)
- State management libraries (Redux, Zustand, MobX)
- CMS or database
- Over-engineered abstractions

## 4. Design Principles

- Minimal
- Calm
- Spacious
- Typography-first
- Dark theme by default
- Subtle motion, never flashy

If a design decision feels “too much”, choose the simpler option.

## 5. Implementation Boundaries

Allowed:

- Static pages and layouts
- File-based content rendering
- Small reusable components (only when repetition is obvious)
- Light motion for presence (hover/enter), not spectacle

Not allowed:

- “systems” (theme system, design system, plugin architecture)
- generalized component factories / render props patterns
- dynamic server behavior (beyond basic Next rendering)

## 6. Code Style Rules

- Prefer plain components over abstractions
- Avoid premature reuse
- Keep components readable and small
- No clever tricks
- Clarity over flexibility
- Prefer explicit composition over configuration

## 7. Content Rules (File-based Only)

Content must live in the repository as files.
No external CMS, no database.

Allowed content formats:

- Markdown / MDX (preferred)
- JSON (only if truly simpler than MD)

Guidelines:

- Content structure should stay simple and human-editable
- Avoid building a “content platform” abstraction layer
- If parsing/formatting gets complex, reduce the content structure instead

## 8. Quality Guardrails (No New Features)

These are not “features”, just baseline quality:

- Accessibility: semantic HTML, focus states, readable contrast
- Performance: avoid heavy client components, avoid large animations
- Consistency: spacing rhythm, type scale, calm motion

## 9. Definition of Done

A change is “done” when:

- It improves clarity or vibe without expanding scope
- It doesn’t introduce new dependencies or systems
- It keeps layouts calm, spacious, typography-led
- It remains easy to read and edit later

## 10. AI Behavior Rules

- Follow this PLAN strictly
- Do NOT introduce new tools or libraries
- Do NOT refactor architecture unless explicitly instructed
- When unsure, choose the simplest solution
- Small, incremental changes are preferred

This file defines the boundaries.
Any change outside these boundaries requires explicit human approval.
