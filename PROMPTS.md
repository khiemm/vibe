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

- Reuse existing layout patterns
- Do not introduce abstractions
- Keep design minimal and consistent

Implementation notes:
[Optional: routing path, layout reuse, etc.]

Apply the changes directly.

---

## Add Blog Post Prompt

Add a new blog post in `content/blog`.

Blog type:
- `fixed-background`: use `<BackgroundImageSection />` near the top of the MDX so the image stays fixed while scrolling.
- `standard`: do not use `<BackgroundImageSection />`; use the normal reading layout and let the global site theme control dark/light mode.

Post topic:
[Describe the topic.]

Content shape:
[Example: essay, note, link-and-commentary, step-by-step reflection.]

Constraints:

- Keep it file-based in MDX
- Reuse existing MDX components when useful
- Do not add abstractions unless repetition is obvious
- If this is a `standard` blog, prefer plain content blocks over decorative sections
- Keep slug, title, excerpt, and body content in English unless explicitly requested otherwise

Implementation notes:
[Optional: preferred slug, date, excerpt.]

Apply the changes directly.

---

## Add English Content Prompt

Add a new English-learning content file in `content/english`.

Content focus:

- Topic: [Required. Example: small talk, job interview, travel English, daily routines.]
- Grammar: [Optional. Be specific if needed, such as present perfect, conditionals, articles. If omitted, keep the content broader and allow mixed grammar coverage.]
- Level: [Beginner / Intermediate / Advanced]
- Tone: [Friendly teacher, concise coach, practical daily-use, exam-focused]
- Output format: [MDX note, short lesson, checklist, dialogue-based lesson]

Include these sections in the content:

- Main explanation of the topic
- Grammar explanation tied to the topic when relevant
- Tips / tricks / common mistakes related to the grammar or topic
- Pronunciation or listening note when useful
- Example sentences: [How many and what style]
- Mini practice: [Optional exercise, rewrite task, fill-in-the-blank, shadowing, speaking prompt]

Optional extras:

- Vocabulary focus: [Optional list of target words or phrases]
- Common confusion: [Optional comparison such as `say / tell`, `for / since`, `a / the`]

Constraints:

- Keep it file-based
- Keep structure simple and human-editable
- Prioritize practical English usage over textbook-heavy explanation unless requested otherwise
- If `grammar` is omitted, do not force a narrow grammar lesson
- Prefer clear examples over long theory

Implementation notes:
[Optional: filename, slug, target audience, desired length, preferred examples.]

Example for tips / tricks:

- Sometimes `her` is pronounced closer to `er` in fast speech
- Native speakers may reduce sounds in connected speech
- A grammar rule may be correct formally, but less common in casual conversation

Apply the changes directly.

---

## Modify Existing Section

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
