# Personal Website

A minimal personal website built with Next.js.

The site focuses on atmosphere rather than features:
calm visual rhythm, spacious layouts, typography-first design, subtle motion.

To keep the codebase stable and prevent over-engineering, two guiding files are used:

- `PLAN.md` - constraints and architecture boundaries
- `PROMPTS.md` - reusable prompt templates for AI-assisted work

---

## Philosophy

This website intentionally prioritizes:

- minimalism
- calm visual rhythm
- spacious layouts
- typography-first design
- subtle motion

If a design decision feels excessive, choose the simpler option.

---

## Project Rules

### PLAN.md

`PLAN.md` defines the boundaries of the project:

- purpose and scope
- allowed tech stack
- what must not be introduced
- design principles
- rules AI agents must follow

Think of `PLAN.md` as the constitution of the project.

### PROMPTS.md

`PROMPTS.md` contains prompt templates for AI tools.

Templates include placeholders wrapped in brackets:

`[like this]`

Replace the bracketed text with your specific task before sending the prompt.

---

## Working Style (Suggested)

- Prefer small, incremental changes
- Keep components readable and explicit
- When in doubt: reduce, simplify, remove

---

## Auth

This repo now includes a server-rendered authentication slice designed around:

- Next.js as the backend-for-frontend
- encrypted HTTP-only cookies
- Cognito as the identity provider
- a serverless auth API built with API Gateway, Lambda, DynamoDB, IAM, CloudWatch, SSM, and Secrets Manager

The app now runs only against the Cognito-backed auth flow, so local development should point `.env.local` at the deployed AWS stack.
Set `AUTH_MODE=disabled` when you want to hide the login UI and pause the app-level auth flow without deleting the AWS resources.

Detailed setup, local testing, and AWS deployment steps live in [docs/cognito-auth.md](docs/cognito-auth.md).
