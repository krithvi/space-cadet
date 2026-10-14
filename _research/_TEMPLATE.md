---
# 1. Copy this file and rename it: the file name becomes the URL (my-study.md → /research/my-study/).
# 2. Fill in the fields, then delete the `published: false` line. That's it: the card appears on its own.
published: false
title: "Short, human title"
# card_title: "Shorter title for the card, if the page title is long"
status: in-progress        # in-progress → "Current missions", published → "Published studies"
badge: "In progress"         # small chip on the card, e.g. "Published · CHI '27"
tagline: "One line for the card. Keep it under about 50 characters."
summary: "One or two sentences. Shown at the top of the entry page."
order: 10                    # position in its grid, lower comes first
thumb: /assets/img/your-entry/thumb.jpg     # card image, 16:10 works best (optional)
patch: orbit               # card art when there is no thumb: path, pulse, feed or orbit
# hero: /assets/img/your-entry/hero.jpg     # image beside the title on the entry page (optional, else thumb)
# link: https://example.com   # optional: make the card open this URL instead of the entry page
facts:                       # small stat tiles under the header (optional)
  Role: What you did
  Timeline: 2026, 10 weeks
  Tools: Figma, Miro
links:                       # buttons in the header; the first one is highlighted (optional)
  - label: Live prototype
    url: https://example.com
---

## The question

Write in plain Markdown: short paragraphs, lists, **bold** and links all work.
Each `##` heading becomes a numbered section (01, 02, …), like the Neuralyzer case study.

## What I did

{% include figure.html src="/assets/img/your-entry/screen.jpg" alt="Describe the image" caption="Optional caption" %}

## What I found

## My role
