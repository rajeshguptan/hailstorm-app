# Hailstorm Website

This folder contains the static Hailstorm website used for GitHub Pages.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Landing page with product overview, video, feature highlights, and licensing links |
| `docs.html` | Product documentation |
| `changelog.html` | Release history |
| `license.html` | Business Source License details |
| `terms.html` | Terms and conditions |
| `js/translations.js` | Multi-language content support |
| `CNAME` | Custom domain configuration for `hailstorm.app` |
| `.nojekyll` | Disables Jekyll processing on GitHub Pages |

## Hosting on GitHub Pages

1. Push the repository to GitHub.
2. Open repository **Settings > Pages**.
3. Set the source to the `main` branch.
4. Set the publishing folder to `/site`.
5. Configure the custom domain using the `CNAME` file.

## Local testing

Use a local static server. For example, with VS Code Live Server:

1. Install the Live Server extension.
2. Right-click `index.html`.
3. Select **Open with Live Server**.
