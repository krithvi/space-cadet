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

### Images

1. **One folder per entry**: `assets/img/<entry-file-name>/`, e.g. `assets/img/write-draw-move/`.
2. **Prepare the image** so the page stays fast (resizes, compresses, strips location data): [16:10]
   ```
   pip install pillow
   python tools/prep_image.py ~/Downloads/photo.jpg assets/img/write-draw-move/setup.jpg            # inside an entry
   python tools/prep_image.py ~/Downloads/photo.jpg assets/img/write-draw-move/thumb.jpg --card     # card picture (16:10)
   python tools/prep_image.py ~/Downloads/me.jpg    assets/img/kavya.jpg --square                   # portrait or favicon
   ```
3. **Use it**:
   - Card picture: `thumb: /assets/img/write-draw-move/thumb.jpg` in the entry's front matter (replaces the drawn badge).
   - Picture beside the title on the entry page: `hero: /assets/img/…` (falls back to `thumb`).
   - Inside the text, anywhere between paragraphs:
     ```
     {% include figure.html src="/assets/img/write-draw-move/setup.jpg" alt="A participant drawing" caption="Study setup" %}
     ```
     Two side by side: add `src2="…" alt2="…"`. Wider than the text: add `wide=true`.
   - Your photo: `portrait: /assets/img/kavya.jpg` under `author:` in `_config.yml`.
   - Favicon: `favicon: /assets/img/favicon.png` under `author:` (square PNG, 512×512).
4. **Always write alt text**: a few words saying what the picture shows.

### Posters

Keep originals in `posters-src/` (git-ignored, never pushed). Make a watermarked, low-resolution preview and point `_data/posters.yml` at it:
```
pip install pillow pymupdf
python tools/make_poster_preview.py posters-src/news-2026.pdf assets/posters/news-2026.webp
```
Then set `image: /assets/posters/news-2026.webp` for that poster.

### Where the look lives

- `_sass/theme.scss`: every page's styles (tokens match the Neuralyzer case study)
- `_sass/main.scss`: the nav keys and the starfield shell
- `_includes/`: the building blocks (cards, grids, porthole, stats, section headings)
- A one-off page with its own design can use its own layout, like `_design/neuralyzer.html` does with `case-study`.
- Backups: use git history (or a branch), not copies like `page2.html`. Jekyll builds every copy, and a duplicate can silently replace the real page.