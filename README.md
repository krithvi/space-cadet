## krithvi.space 
<!--home-->
This is my personal website hosted on GitHub Pages (using [Jekyll](https://jekyllrb.com/)) and deployed to GitHub Pages by `.github/workflows/jekyll.yml`. It has been written using [Markdown](./markdown.md). Feel free to contact me through the website (especially if you discover the *secrets beyond*).

### Light updates (no HTML needed)

| To add… | Edit | Notes |
|---|---|---|
| A research study | copy `_research/_TEMPLATE.md` | `status: in-progress` lands in *Current missions*, `published` in *Published studies* |
| A design case study | copy `_design/_TEMPLATE.md` | Shows up in the Design Lab and the count on Base |
| A paper | `_data/publications.yml` | The Publications stat on Base counts these |
| A course you TA | `_data/teaching.yml` | The Courses stat on Base counts these |
| A poster | `_data/posters.yml` | Make the preview with `tools/make_poster_preview.py`; keep originals in `posters-src/` |
| Bio, tags, timeline, service | `_data/about.yml` | |
| Your photo, summary, links | `author:` in `_config.yml` | Leave a link `""` to hide its button |
| The three stats | `_data/stats.yml` | Fixed `value:` or `count:` a data file |

Images go in `assets/img/<entry-name>/`. Card images look best at 16:10.

### Where the look lives

- `_sass/theme.scss`: every page's styles (tokens match the Neuralyzer case study)
- `_sass/main.scss`: the nav keys and the starfield shell
- `_includes/`: the building blocks (cards, grids, porthole, stats, section headings)
- A one-off page with its own design can use its own layout, like `_design/neuralyzer.html` does with `case-study`.