import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';

// New end-to-end test: verify dependency execution order and saved entries
// Setup: a collection with two requests where A is a dependency of B

test.describe('Dependency execution order', () => {
  test('should execute dependency before the main request and save dependency result', async ({ appLoaded }) => {
    // Navigate to collections UI
    const collPanel = new CollectionsPanel(appLoaded);
    await collPanel.addCollection('DepSuite');
    // Add dependency request A
    await collPanel.addRequestToCollection('DepSuite', 'Dependency A');
    // Add main request B that depends on A
    await collPanel.addRequestToCollection('DepSuite', 'Main B');
    // Wire dependency (Main B depends on Dependency A)
    await collPanel.setDependency('DepSuite', 'Main B', 'Dependency A');
    // Run all requests in the collection
    await collPanel.runAllInCollection('DepSuite');
    // Verify dependency ran before main request and both saved
    const recordsA = await collPanel.getLastEntriesFor('Dependency A');
    const recordsB = await collPanel.getLastEntriesFor('Main B');
    expect(recordsA.length).toBeGreaterThan(0);
    expect(recordsB.length).toBeGreaterThan(0);
    const lastA = recordsA[recordsA.length - 1];
    const lastB = recordsB[recordsB.length - 1];
    expect(new Date(lastA.timestamp).getTime()).toBeLessThan(new Date(lastB.timestamp).getTime());
  });
});
