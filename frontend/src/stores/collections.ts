import { defineStore } from 'pinia';
import type { Collection, Request, Folder } from '../types';
import { useAppStore } from './index';
import { useRequestsStore } from './requests';

export const useCollectionsStore = defineStore('collections', {
  state: () => ({
    collections: [] as Collection[],
    selectedCollectionId: null as string | null,
  }),

  getters: {
    selectedCollection: (state) => {
      return state.collections.find(c => c.id === state.selectedCollectionId) || null;
    },

    findItemById: (state) => {
      return (id: string) => {
        console.log('[COLLECTIONS] findItemById searching for:', id);

        // First check if it's a collection itself
        for (const collection of state.collections) {
          if (collection.id === id) {
            console.log('[COLLECTIONS] Found collection:', collection);
            return collection;
          }
        }

        // Then search within collection items
        for (const collection of state.collections) {
          console.log('[COLLECTIONS] Searching in collection:', collection.name, 'items:', collection.items?.length);
          const findInItems = (items: any[]): any => {
            for (const item of items) {
              console.log('[COLLECTIONS] Checking item:', item.id, item.name, item.url);
              if (item.id === id) {
                console.log('[COLLECTIONS] Found item:', item);
                return item;
              }
              if ('items' in item && item.items) {
                const found = findInItems(item.items);
                if (found) return found;
              }
            }
            return null;
          };

          const result = findInItems(collection.items);
          if (result) {
            console.log('[COLLECTIONS] findItemById returning:', result);
            return result;
          }
        }
        console.log('[COLLECTIONS] findItemById found nothing');
        return null;
      };
    }
  },

  actions: {
    generateId(prefix: string): string {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    addCollection() {
      const collection: Collection = {
        id: this.generateId('coll'),
        name: 'New Collection',
        items: [],
        variables: []
      };
      this.collections.push(collection);
      this.saveCollections();
    },

    updateCollection(collection: Collection) {
      const index = this.collections.findIndex(c => c.id === collection.id);
      if (index !== -1) {
        this.collections[index] = collection;
        this.saveCollections();
      }
    },

    deleteCollection(id: string) {
      this.collections = this.collections.filter(c => c.id !== id);
      this.saveCollections();
    },

    addFolder(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
      const folder: Folder = {
        id: this.generateId('fol'),
        name: 'New Folder',
        items: []
      };

      if (targetType === 'collection') {
        const collection = this.collections.find(c => c.id === targetId);
        if (collection) {
          collection.items.push(folder);
        }
      } else if (targetType === 'folder') {
        const addToItems = (items: any[]): boolean => {
          for (const item of items) {
            if (item.id === targetId) {
              item.items.push(folder);
              return true;
            }
            if ('items' in item && item.items) {
              if (addToItems(item.items)) {
                return true;
              }
            }
          }
          return false;
        };

        for (const collection of this.collections) {
          if (addToItems(collection.items)) {
            break;
          }
        }
      }

      this.saveCollections();
    },

    addRequest(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
      const request: Request = {
        id: this.generateId('req'),
        name: 'New Request',
        method: 'GET',
        url: '',
        headers: [],
        body: { type: 'none', content: '' }
      };

      if (targetType === 'collection') {
        const collection = this.collections.find(c => c.id === targetId);
        if (collection) {
          collection.items.push(request);
        }
      } else if (targetType === 'folder') {
        const addToItems = (items: any[]): boolean => {
          for (const item of items) {
            if (item.id === targetId) {
              item.items.push(request);
              return true;
            }
            if ('items' in item && item.items) {
              if (addToItems(item.items)) {
                return true;
              }
            }
          }
          return false;
        };

        for (const collection of this.collections) {
          if (addToItems(collection.items)) {
            break;
          }
        }
      }

      this.saveCollections();
    },

    renameItem(id: string, newName: string) {
      console.log('[COLLECTIONS] renameItem called with id:', id, 'newName:', newName);
      // First check if it's a collection itself
      for (const collection of this.collections) {
        if (collection.id === id) {
          console.log('[COLLECTIONS] Renaming collection:', collection.name, 'to:', newName);
          collection.name = newName;
          this.saveCollections();
          return;
        }
      }

      // Then search within collection items
      for (const collection of this.collections) {
        const findAndRename = (items: any[]): boolean => {
          for (const item of items) {
            console.log('[COLLECTIONS] Checking item:', item.id, item.name, 'type:', 'method' in item ? 'request' : 'folder');
            if (item.id === id) {
              console.log('[COLLECTIONS] Found item to rename:', item.name, 'to:', newName);
              item.name = newName;
              return true;
            }
            if ('items' in item && item.items) {
              if (findAndRename(item.items)) {
                return true;
              }
            }
          }
          return false;
        };

        if (findAndRename(collection.items)) {
          console.log('[COLLECTIONS] Successfully renamed item with id:', id);
          break;
        }
      }
      this.saveCollections();
      console.log('[COLLECTIONS] renameItem completed for id:', id);
    },

    deleteRequest(id: string) {
      const deleteFromItems = (items: any[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === id && 'method' in items[i]) {
            items.splice(i, 1);
            return true;
          }
          if ('items' in items[i] && items[i].items) {
            if (deleteFromItems(items[i].items)) {
              return true;
            }
          }
        }
        return false;
      };
      for (const collection of this.collections) {
        if (deleteFromItems(collection.items)) {
          this.saveCollections();
          break;
        }
      }
    },

    deleteFolder(id: string) {
      const deleteFromItems = (items: any[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === id && 'items' in items[i]) {
            items.splice(i, 1);
            return true;
          }
          if ('items' in items[i] && items[i].items) {
            if (deleteFromItems(items[i].items)) {
              return true;
            }
          }
        }
        return false;
      };
      for (const collection of this.collections) {
        if (deleteFromItems(collection.items)) {
          this.saveCollections();
          break;
        }
      }
    },

    selectCollection(id: string | null) {
      this.selectedCollectionId = id;
      // Clear request selection when selecting a collection
      const requestsStore = useRequestsStore();
      if (id !== null) {
        requestsStore.selectedRequestId = null;
      }
      this.saveCollections();
    },

    moveItem(sourceItemId: string, targetContainerId: string, targetContainerType: 'collection' | 'folder', targetIndex?: number) {
      console.log('🔄 [COLLECTIONS] moveItem called:', { sourceItemId, targetContainerId, targetContainerType, targetIndex });

      // Find and remove the source item
      let sourceItem: any = null;
      let sourceContainer: any[] | null = null;
      let sourceIndex = -1;

      // Search in all collections and their nested items
      const findAndRemove = (items: any[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === sourceItemId) {
            sourceItem = items[i];
            sourceContainer = items;
            sourceIndex = i;
            items.splice(i, 1);
            return true;
          }
          if ('items' in items[i] && items[i].items) {
            if (findAndRemove(items[i].items)) {
              return true;
            }
          }
        }
        return false;
      };

      // Remove from all collections
      let sourceFound = false;
      for (const collection of this.collections) {
        if (findAndRemove(collection.items)) {
          sourceFound = true;
          console.log('✅ [COLLECTIONS] Source item found and removed from collection:', collection.name);
          break;
        }
      }

      if (!sourceItem) {
        console.error('❌ [COLLECTIONS] Source item not found:', sourceItemId);
        return false;
      }

      console.log('[COLLECTIONS] Source item found and removed:', sourceItem);

      // Find target container and insert the item
      let targetFound = false;
      if (targetContainerType === 'collection') {
        console.log('🎯 [COLLECTIONS] Looking for target collection:', targetContainerId);
        const targetCollection = this.collections.find(c => c.id === targetContainerId);
        if (targetCollection) {
          if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= targetCollection.items.length) {
            targetCollection.items.splice(targetIndex, 0, sourceItem);
            console.log('✅ [COLLECTIONS] Item inserted at index', targetIndex, 'in collection:', targetCollection.name);
          } else {
            targetCollection.items.push(sourceItem);
            console.log('✅ [COLLECTIONS] Item appended to collection:', targetCollection.name);
          }
          targetFound = true;
        } else {
          console.error('❌ [COLLECTIONS] Target collection not found:', targetContainerId);
        }
      } else if (targetContainerType === 'folder') {
        const findAndInsert = (items: any[]): boolean => {
          for (const item of items) {
            if (item.id === targetContainerId && 'items' in item) {
              if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= item.items.length) {
                item.items.splice(targetIndex, 0, sourceItem);
              } else {
                item.items.push(sourceItem);
              }
              return true;
            }
            if ('items' in item && item.items) {
              if (findAndInsert(item.items)) {
                return true;
              }
            }
          }
          return false;
        };

        console.log('🎯 [COLLECTIONS] Looking for target folder:', targetContainerId);
        for (const collection of this.collections) {
          if (findAndInsert(collection.items)) {
            targetFound = true;
            console.log('✅ [COLLECTIONS] Item moved to folder in collection:', collection.name);
            break;
          }
        }

        if (!targetFound) {
          console.error('❌ [COLLECTIONS] Target folder not found:', targetContainerId);
        }
      }

      if (targetFound) {
        this.saveCollections();
        console.log('[COLLECTIONS] moveItem completed successfully');
        return true;
      } else {
        // Revert the removal if target wasn't found
        if (sourceContainer && sourceIndex >= 0) {
          sourceContainer.splice(sourceIndex, 0, sourceItem);
          console.error('[COLLECTIONS] Move failed, source item restored');
        }
        return false;
      }
    },

    saveCollections() {
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    }
  }
});