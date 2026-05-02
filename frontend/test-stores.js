// Simple test to check if stores work
import { createPinia } from 'pinia';
import { useCollectionsStore } from './stores/collections';
import { useRequestsStore } from './stores/requests';
import { useUIStore } from './stores/ui';

console.log('Testing store imports...');

try {
  const pinia = createPinia();

  const collectionsStore = useCollectionsStore(pinia);
  const requestsStore = useRequestsStore(pinia);
  const uiStore = useUIStore(pinia);

  console.log('Collections store state:', collectionsStore.$state);
  console.log('Requests store state:', requestsStore.$state);
  console.log('UI store state:', uiStore.$state);

  console.log('Stores created successfully!');
} catch (error) {
  console.error('Error creating stores:', error);
}