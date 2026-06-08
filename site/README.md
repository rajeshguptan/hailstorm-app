# Hailstorm Website

This folder contains the static website for Hailstorm, ready for GitHub Pages hosting.

## Structure

- `index.html` - Main landing page with YouTube video, features, licenses
- `docs.html` - Documentation with Flowbite accordion
- `changelog.html` - Changelog history
- `license.html` - Business Source License details
- `terms.html` - Terms and Conditions with liability disclaimer
- `js/translations.js` - Multi-language support (EN, ES, FR, DE, JA, ZH, PT)
- `CNAME` - Custom domain configuration (hailstorm.app)
- `.nojekyll` - Bypass Jekyll processing

## Hosting on GitHub Pages

1. Push this repository to GitHub
2. Go to repository settings → Pages
3. Set source to `main` branch, `/site` folder
4. Configure custom domain via the CNAME file

## Testing Locally

In VS Code, install the "Live Server" extension and right-click `index.html` → "Open with Live Server".