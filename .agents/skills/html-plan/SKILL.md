---
name: html-plan
description: Create implementation plans as standalone HTML documents and upload them with postplan.
---

# HTML Plan

Create implementation plans as HTML files instead of Markdown files.

## Create the Plan

The template is located at [`template.html`](./template.html) beside this skill file.

Copy it to the desired output path:

```bash
cp template.html ./plan.html
```

If the current working directory does not contain the skill, resolve
`template.html` relative to this `SKILL.md` file.

Replace the content between these markers:

```html
<!-- PLAN:START -->
<!-- PLAN:END -->
```

Do not rewrite, duplicate, or remove the surrounding template.

## Plan Content

Write semantic HTML between the plan markers. Do not write Markdown.

A typical plan should contain:

- A header with the plan title and summary.
- Goals and non-goals.
- Relevant findings from the existing codebase.
- The proposed implementation approach.
- Ordered implementation steps.
- Files or symbols expected to change.
- Risks and edge cases.
- A concrete validation strategy.
- Open questions, when unresolved questions exist.

Include only useful sections. Do not add empty sections to satisfy a fixed
outline.

Plans must be detailed enough for another agent to implement without repeating
the initial investigation.

## Available Classes

Use ordinary semantic HTML wherever possible. These optional classes provide
the standard visual components:

- `eyebrow` — small label above the plan title.
- `lede` — introductory plan summary.
- `meta` — row containing status badges.
- `badge` — neutral label.
- `badge success` — confirmed or completed investigation.
- `badge warning` — caution or unresolved question.
- `toc` — table of contents.
- `card` — bordered content group.
- `grid` — responsive collection of cards.
- `callout` — important information.
- `callout warning` — risk or warning.
- `steps` — ordered implementation steps.
- `file-list` — list of affected files.
- `checklist` — validation checklist.
- `muted` — secondary text.
- `section-number` — section number within a heading.

Do not inspect the template merely to discover additional styling options. The
classes above are sufficient for normal plans.

Do not invent classes or modify the template CSS unless the task has a
presentation requirement that the existing template cannot satisfy.

## Content Rules

- Preserve the template's document shell and styles.
- Keep all plan content between the plan markers.
- Do not add external stylesheets, scripts, fonts, images, or CDNs.
- Do not add JavaScript unless the user explicitly requests it.
- Do not use inline `style` attributes.
- Use repository-relative paths when referring to files.
- Wrap paths, commands, identifiers, and symbols in `<code>`.
- Use `<pre><code>` for multiline code or command examples.
- HTML-escape content copied from files, terminal output, or user input.
- Do not claim that proposed changes have already been implemented.
- Keep the document readable on phones and desktop screens.

At minimum, escape:

- `&` as `&amp;`
- `<` as `&lt;`
- `>` as `&gt;`
- `"` as `&quot;` inside attributes

## Suggested Content Shape

This is a content example, not a second template:

```html
<header>
  <p class="eyebrow">Implementation plan</p>
  <h1>Plan title</h1>
  <p class="lede">
    Briefly explain the change, its motivation, and intended result.
  </p>
  <div class="meta">
    <span class="badge">Draft</span>
    <span class="badge success">Repository inspected</span>
  </div>
</header>

<nav class="toc" aria-label="Table of contents">
  <h2>Contents</h2>
  <ol>
    <li><a href="#goals">Goals</a></li>
    <li><a href="#findings">Findings</a></li>
    <li><a href="#approach">Approach</a></li>
    <li><a href="#steps">Implementation steps</a></li>
    <li><a href="#validation">Validation</a></li>
  </ol>
</nav>

<section id="goals">
  <h2><span class="section-number">01.</span> Goals</h2>
  <div class="grid">
    <article class="card">
      <h3>Goal</h3>
      <p>Describe the intended outcome.</p>
    </article>
    <article class="card">
      <h3>Non-goal</h3>
      <p>Clarify intentionally excluded work.</p>
    </article>
  </div>
</section>

<section id="findings">
  <h2><span class="section-number">02.</span> Findings</h2>
  <div class="callout">
    Summarize verified codebase behavior and reference concrete paths.
  </div>
</section>

<section id="approach">
  <h2><span class="section-number">03.</span> Approach</h2>
  <p>Explain the proposed design and relevant tradeoffs.</p>
</section>

<section id="steps">
  <h2><span class="section-number">04.</span> Implementation steps</h2>
  <ol class="steps">
    <li>
      <h3>Update the target component</h3>
      <p>Describe the file, symbol, and intended behavior.</p>
    </li>
  </ol>
</section>

<section id="validation">
  <h2><span class="section-number">05.</span> Validation</h2>
  <ul class="checklist">
    <li>Run the relevant automated tests.</li>
    <li>Run formatting, linting, and type checking.</li>
    <li>Manually verify the primary user flow.</li>
  </ul>
</section>
```

Adapt the structure to the task rather than copying unnecessary sections.

## Validate the Document

Before uploading, verify that:

- No placeholder content remains.
- Both plan markers remain present.
- The `<title>` describes the task.
- Table-of-contents links point to existing section IDs.
- Referenced files and symbols were verified.
- Implementation steps are ordered and actionable.
- Validation steps are concrete.
- The HTML has no external dependencies.

## Upload the Plan

Upload the completed file:

```bash
pnpm dlx postplan upload ./plan.html \
  --description "Short plan title or description"
```

Use the actual output path if it is not `./plan.html`.

Do not upload an incomplete plan unless the user explicitly asks for a draft.

After a successful upload, report:

- The uploaded URL.
- A small summary.

If the upload fails, preserve the local file and report the command error.