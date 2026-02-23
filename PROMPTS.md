# AI Prompt Templates

## Global Rule Header

(Always put this at the top of prompts that modify code)

This project is governed by PLAN.md.
Follow it strictly as non-negotiable constraints.

---

## Vibe Refinement Prompt

You are refining an existing personal website.

Focus on:

- Typography rhythm
- Spacing and negative space
- Calm, quiet, introspective mood
- Subtle motion only

Context:
[Describe what part of the UI feels wrong or what you want to improve.]

Examples:

- The hero section feels slightly cramped.
- The animation feels a bit too fast.
- The typography scale feels unbalanced.

Constraints:

- Do NOT change architecture
- Do NOT add libraries or features
- Prefer small, precise adjustments

Task:
[Describe the specific adjustment you want.]

Apply the changes directly.

---

## Micro-Adjustment Prompt (Fast)

Make tiny adjustments only (no redesign).

Area:
[component / page]

Adjust:

- spacing (padding/margins/gap)
- type scale (font size/leading/tracking)
- motion (duration/ease/delay)
- layout rhythm (max-width, line-length)

Constraints:

- No new components unless absolutely necessary
- No new dependencies
- Keep changes minimal and localized

Apply the changes directly.

---

## Add Page Prompt (Safe)

Add a new page to the website.

Page purpose:
[Describe the purpose of the page. Example: About page, Notes page.]

Content expectation:
[Describe roughly what should appear on the page.]

Constraints:

- Follow PLAN.md strictly
- Reuse existing layout patterns
- Do not introduce abstractions
- Keep design minimal and consistent

Implementation notes:
[Optional: routing path, layout reuse, etc.]

Apply the changes directly.

---

## Modify Existing Section

This project is governed by PLAN.md.
Follow it strictly as non-negotiable constraints.

You are modifying an existing section of the site.

Section:
[Specify the section or component.]

Current issue:
[Describe what feels wrong.]

Desired outcome:
[Describe the result you want.]

Constraints:

- Do not introduce new libraries
- Do not change architecture
- Prefer minimal changes

Apply the changes directly.

---

## Bugfix Prompt (No Scope Creep)

Fix a bug with minimal impact.

Bug:
[describe the bug + expected behavior]

Where:
[file paths / components]

Rules:

- Fix the root cause, not symptoms
- Do NOT add features
- Do NOT introduce new libraries
- Prefer the smallest possible diff

After fixing:

- Briefly explain what caused it
- Suggest a concise git commit message

Apply the changes directly.

---

## Commit Message Prompt

Summarize the changes you just made and suggest a concise git commit message.

Context:
[Optional: describe what feature or change was implemented.]

Focus on intent, not implementation details.
