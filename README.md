# Matt · portfolio

A single-page portfolio built with React, TypeScript, Vite and GSAP. It opens
with an animated story ("The Architecture Machine": a blueprint becomes a city,
splits into the layers of a system and clicks back together), then shows
About, Career path, Projects, Courses and awards, and Contact.

## Run it locally

You need Node.js 20.19 or newer (22 recommended).

```bash
npm install
npm run dev       # http://localhost:5173
```

Other commands:

```bash
npm run build     # type-checks, then builds the site into dist/
npm run preview   # serves the built site to check it before publishing
```

## Change the text

Everything the page says is in **`src/content/portfolio.json`**: your profile,
the about text and quick facts, skills, career steps, projects, certificates
and contact details. Edit the JSON and the page updates; no code changes are
needed.

- **Career steps** (`career`): `type` is `study`, `work`, `research` or
  `milestone`. Dates use `YYYY-MM`; leave `end` out for something that is still
  going on.
- **Projects** (`projects`): `categories` must use the ids listed in
  `projectCategories`. Tools in `stack` show their brand icon when it is known
  (see `src/site/tech.tsx` to add one).
- **Certificates** (`certificates`): `file` can be a Google Drive share link;
  it opens inside the page's viewer.

The layout choices (navigation, card styles, how many rows show before "See
more", and so on) are in the `config` object in `src/App.tsx`.

## Where things are

| Path | What it is |
| --- | --- |
| `src/content/portfolio.json` | All the text and links |
| `src/App.tsx` | Page layout options |
| `src/scene/` | The opening animation and the colour theme |
| `src/site/` | Navigation, sections, project-card animations, styles |
| `src/story/` | Plays the opening animation (one play / pause / replay button, captions) |
| `src/site/assets/matt-face.png` | The logo picture |
| `public/` | Favicon and icons |

## Publish on GitHub Pages

The repository already includes the workflow `.github/workflows/deploy.yml`.

1. Create a repository on GitHub and push this folder to it (branch `main` or
   `master`).
2. On GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. The workflow runs on every push to that branch (you can also start it from the
   **Actions** tab). When it finishes, the site is live at
   `https://<your-user>.github.io/<repository>/`, or at
   `https://<your-user>.github.io/` if the repository is named
   `<your-user>.github.io`.

Asset paths are relative, so the same build works at either address without
changing any setting.
