# Hailstorm Integration Tests

This directory contains end-to-end tests for the Hailstorm Electron application using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Ensure the frontend is built:
```bash
cd ../frontend
npm run build
npm run build:electron
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see the browser)
```bash
npm test:headed
```

### Run specific test file
```bash
npx playwright test electron.spec.ts
```

### Run tests with UI mode
```bash
npx playwright test --ui
```

## Test Structure

- `tests/electron.spec.ts` - Main test suite for Electron app functionality
- `global-setup.ts` - Builds the Electron app before running tests
- `playwright.config.ts` - Playwright configuration for Electron testing

## Test Coverage

The tests cover:

### Collection Management
- ✅ Collection panel display when collection is clicked
- ✅ Collection panel tabs (Properties, Description, Scripts, Auth)
- ✅ Collection vs request selection behavior
- ✅ Collection name editing
- ✅ Workspace location selection
- ✅ Collection variables management
- ✅ Collection description editing
- ✅ Pre-request and test scripts
- ✅ Authentication settings

### File-based Storage
- ✅ Workspace location selection UI
- ✅ Data persistence across sessions

## Notes

- Tests require the Electron app to be built before running
- Some file dialog interactions may need special handling in CI environments
- Tests run sequentially due to Electron app requirements