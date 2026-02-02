# Personal Website — Architecture Plan

## 1. Purpose

This project is a personal website.
It exists to express mood, thoughts, and presence.
It is NOT a product, NOT a SaaS, NOT a dashboard.

## 2. Scope

- Single-user
- No authentication
- No admin panel
- No dynamic backend logic
- File-based content only

If a feature is not explicitly required, it should NOT be added.

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

## 5. Code Style Rules

- Prefer plain components over abstractions
- Avoid premature reuse
- Keep components readable and small
- No clever tricks
- Clarity over flexibility

## 6. AI Behavior Rules

- Follow this PLAN strictly
- Do NOT introduce new tools or libraries
- Do NOT refactor architecture unless explicitly instructed
- When unsure, ask or choose the simplest solution
- Small, incremental changes are preferred

This file defines the boundaries.
Any change outside these boundaries requires explicit human approval.
