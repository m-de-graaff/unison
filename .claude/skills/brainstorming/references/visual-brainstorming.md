# Showing options instead of describing them

When the question is genuinely visual, build the thing and hand over a link. Use the **Artifact**
tool — a published page needs no server, no port, no background process, and updates in place.

## Is this actually a visual question?

The test: **would the user understand this better by seeing it than by reading it?**

| Show it | Ask in chat |
|---|---|
| Layouts, wireframes, navigation structure | "What does *personality* mean for this product?" |
| Architecture, data flow, state machines | Which of three approaches to take |
| Two visual designs side by side | Scope, requirements, constraints |
| Spacing, hierarchy, look and feel | Pros/cons, API shape, data modelling |

A question *about* a UI topic is not automatically a visual question. Most brainstorming
questions are text and belong in `AskUserQuestion`.

## The loop

1. **Load the `artifact-design` skill first.** Required before writing the page, and it
   calibrates how much design the request actually warrants.
2. Write the page to a file in your scratchpad directory. Content only — no `<!doctype>`,
   `<html>`, `<head>`, or `<body>`; those are added at publish time.
3. Publish with `Artifact`, passing a `icon` and a one-line `description`.
4. Give the user the URL, plus **one line in chat saying what's on it** ("three homepage
   layouts — A dense, B airy, C sidebar"). They should not have to open the tab to know whether
   it's worth opening.
5. They reply in chat. Iterate or move on.

**Iterating: republish the same file path.** Same path means the same URL, so the tab they
already have open just needs a refresh. A new path mints a new URL and a second tab — only do
that when it's genuinely a different artifact. Keep the `icon` stable across redeploys too;
users find the tab by its icon.

## Label everything

There is no click-back channel — feedback arrives as text in the conversation. So **every
option carries a visible letter or number**, and you refer to them the same way in chat. "A or
B?" only works if the page says A and B. Without labels you get "the second one, I think" and a
round trip resolving which one that was.

## What to build

- **Diagrams: use mermaid.** It renders natively in `<pre class="mermaid">` blocks — don't
  hand-draw boxes in HTML or reach for a diagramming library.
- **Two to four options per page.** Five is a survey, not a decision.
- **Scale fidelity to the question.** Grey-box wireframes for a layout question; real type,
  colour, and spacing only when polish *is* the question. Premature polish makes people react to
  the colour instead of the structure.
- **Real content where it matters.** For a photo gallery, use real images — lorem ipsum and grey
  rectangles hide exactly the problems you're trying to surface.
- **Put the question on the page**, not just the options: "Which reads as more trustworthy?"
  beats "Pick one."

Everything must be self-contained — a strict CSP blocks external scripts, stylesheets, fonts,
and fetches. Inline the CSS, embed images as data URIs. Style both light and dark; the viewer's
theme decides.

## Don't

- Don't publish a page that imitates a real company, product, or person's branding, or that
  presents fabricated records as genuine — the mockup is for deciding a design, not for looking
  like something real.
- Don't leave the user on a resolved page while the conversation has moved on. Say "we're back
  in chat for the next bit" rather than letting a stale tab imply the question is still open.
- Don't publish when the answer is words. The tab is a cost; charge it only for pictures.
