# Machine Problems

Technical systems explained with interactive visualizations — so you understand how things work before you trust AI to write the code.

## Development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # production build
npm run preview  # preview production build
```

## Adding a problem

Machine Problems is visual-first and example-first. Do not add prose-only topics.

Every problem needs:

- A concrete named scenario before formal terminology.
- An interactive visualization before the first long prose section.
- A worked example that uses real values, messages, payloads, or states.
- A mapping from example objects to formal terms.
- A checklist for evaluating AI-generated code or designs.

1. Create `src/content/problems/your-topic.mdx` with frontmatter:

```yaml
---
title: Your Topic
description: One-line summary
category: protocol | os | distributed | security | networking
difficulty: intro | intermediate | advanced
tags: [tag1, tag2]
---
```

2. Create `src/components/viz/YourTopicViz.tsx` with the interactive visualization.
3. Import and embed the visualization near the top of the MDX with `client:load`.

## Teaching Pattern

Use this section order by default:

1. **Concrete story** — "JayP uses Print Express to read Google Drive files."
2. **Interactive visual** — click/step through the actual state changes.
3. **Term mapping** — example actor -> formal term.
4. **Exact mechanics** — requests, responses, data structures, algorithms.
5. **AI review checks** — invariants to inspect in generated code.
6. **Further reading** — specs and high-quality explainers.

The project skill `.cursor/skills/visual-example-explainer/SKILL.md` packages this workflow for future agent sessions.

## Architecture

- **Astro 5** (SSG) + **React 19** (interactive islands) + **Tailwind CSS 3** + **MDX**
- Content collection: `src/content/problems/`
- Viz components: `src/components/viz/`
- Shared diagram primitives: `src/components/diagram/`

## License

MIT
