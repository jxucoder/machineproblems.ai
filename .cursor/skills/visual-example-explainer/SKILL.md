---
name: visual-example-explainer
description: Creates visual-first, example-first technical explanations for Machine Problems. Use when adding or revising concept pages, interactive diagrams, protocol flows, system design explainers, OS/networking/security visualizations, or when the user asks to make an explanation more visual, concrete, beginner-friendly, example-based, Manim-like, ByteByteGo-like, or explorable.
---

# Visual Example Explainer

Use this skill to create Machine Problems pages and visualizations that teach through concrete examples, visible state, and guided interaction.

## Core Rule

Do not start with abstraction. Start with a named scenario, show it visually, then map it to formal terms.

Default structure:

1. **Concrete story**: named person/app/service/data/failure.
2. **Interactive visual**: appears before long prose.
3. **Term mapping**: example object -> formal concept.
4. **Exact mechanics**: real messages, state, payloads, algorithms.
5. **AI review checks**: visual invariants for evaluating generated code.
6. **Further reading**: specs and strong visual explainers.

## Visualization Requirements

- First frame must be readable at rest.
- Every animation must encode meaning: data moves, state changes, token transforms, queue fills, memory page swaps, packet crosses a boundary.
- Show state directly: current message, token, buffer, lock holder, cache entry, process state, page table row, etc.
- Prefer clickable step playback, scrubbers, hovers, sliders, or scroll-linked reveal over static diagrams.
- Avoid sandbox-only widgets. The author guides the learner through a worked example.
- Use exact values in examples: URLs, headers, JSON, numbers, scopes, TTLs, ports, states.

## Interaction Pattern

For protocol/system flows:

1. Use semantic actors with consistent colors.
2. Provide Play/Pause, Previous/Next, and clickable step cards.
3. Active step highlights both the visual path and the state artifact.
4. Technical details are adjacent to the step, not hidden far below.
5. Keep front-channel/back-channel/process-boundary distinctions visible.

## Writing Rules

- No abstract term without an example nearby.
- No prose-only concept sections.
- Keep paragraphs short; prose captions the visual.
- Introduce jargon immediately after the concrete object it names.
- Use tables for mappings and invariants.

## Visual Style

- Prefer clean Manim-like SVG/Framer Motion for native page visuals.
- Use ByteByteGo/Alex Xu simplicity for architecture diagrams: clear boxes, arrows, numbered steps, no clutter.
- Do not use iframe editors or external diagram embeds as the primary learning experience.
- Do not use decorative animation. Motion must show causality, transformation, or progression.

## Quality Checklist

Before finishing, verify:

- A novice can explain the first frame without reading the whole article.
- The page has a named worked example before formal definitions.
- The visualization shows what changes over time.
- Every formal term maps to an example object.
- The user can click/scrub steps instead of passively reading.
- AI-generated code checks are phrased as concrete invariants.
- Build/lints pass after implementation.

## Example

Bad:

> OAuth uses authorization codes and access tokens.

Good:

> JayP clicks Connect Google Drive in Print Express. Google Accounts returns `code=abc123`; Print Express exchanges that code for `access_token=eyJ...`; only the access token goes to the Google Drive API.

Mapping:

| Example | Formal term |
|---|---|
| JayP | Resource Owner |
| JayP's browser | User-Agent |
| Print Express | Client |
| Google Accounts | Authorization Server |
| Google Drive API | Resource Server |
