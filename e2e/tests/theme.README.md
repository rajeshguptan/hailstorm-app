# Theme Testing

## Overview

The theme tests verify that Hailstorm applies and persists light, dark, and system theme settings consistently across the application.

## Coverage

- Theme is applied on app startup.
- Theme preference persists across reloads and restarts.
- Light, dark, and system theme modes are supported.
- System theme changes are reflected in the app.
- Settings panel displays the current theme selection.
- Theme switching updates the UI immediately.
- Theme classes are applied consistently to core layout elements.
- Navigation between views preserves the selected theme.

## Running tests

Start the app dev server from `app/`:

```bash
cd ../app
npm run dev
```

Run the theme spec from `e2e/`:

```bash
npx playwright test tests/theme.spec.ts
```

Run only the theme project if configured in your local Playwright config:

```bash
npx playwright test tests/theme.spec.ts --project=theme-tests
```
