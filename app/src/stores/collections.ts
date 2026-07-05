import { defineStore } from 'pinia';
import type { Collection, Request, Folder } from '../types';
import { useAppStore } from './index';
import { useRequestsStore } from './requests';
import { useUIStore } from './ui';
import { logger } from '../utils/logger';

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
        logger.debug('[COLLECTIONS] findItemById searching for:', id);

        // First check if it's a collection itself
        for (const collection of state.collections) {
          if (collection.id === id) {
            logger.debug('[COLLECTIONS] Found collection:', collection);
            return collection;
          }
        }

        // Then search within collection items
        for (const collection of state.collections) {
          logger.debug('[COLLECTIONS] Searching in collection:', collection.name, 'items:', collection.items?.length);
          const findInItems = (items: any[]): any => {
            for (const item of items) {
              logger.debug('[COLLECTIONS] Checking item:', item.id, item.name, item.url);
              if (item.id === id) {
                logger.debug('[COLLECTIONS] Found item:', item);
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
            logger.debug('[COLLECTIONS] findItemById returning:', result);
            return result;
          }
        }
        logger.debug('[COLLECTIONS] findItemById found nothing');
        return null;
      };
    }
  },

  actions: {
    generateId(prefix: string): string {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

async addCollection() {
       const collectionId = this.generateId('coll');
       let workspaceLocation = '';
       try {
         const homeDir = window.api?.getHomeDirectory ? await window.api.getHomeDirectory() : null;
         workspaceLocation = homeDir ? `${homeDir}/hailstorm/${collectionId}` : '';
       } catch (err) {
         logger.debug('[COLLECTIONS] Could not get home directory:', err);
       }
       const collection: Collection = {
         id: collectionId,
         name: 'New Collection',
         items: [],
         variables: [],
         workspaceLocation
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

duplicateCollection(id: string) {
       const collection = this.collections.find(c => c.id === id);
       if (collection) {
         const duplicated: Collection = {
           id: this.generateId('coll'),
           name: `${collection.name} (copy)`,
           items: JSON.parse(JSON.stringify(collection.items)),
           variables: JSON.parse(JSON.stringify(collection.variables)),
           workspaceLocation: collection.workspaceLocation
         };
         this.collections.push(duplicated);
         this.saveCollections();
       }
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
        body: { type: 'none', content: '' },
        isPrivate: true
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

    addHttpRequest(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
      const request: Request = {
        id: this.generateId('req'),
        name: 'New HTTP Request',
        method: 'GET',
        url: '',
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        body: { type: 'none', content: '' },
        isPrivate: true
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

addGraphqlRequest(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
       const request: Request = {
         id: this.generateId('req'),
         name: 'New GraphQL Request',
         method: 'POST',
         url: '',
         headers: [
           { key: 'Content-Type', value: 'application/json', enabled: true }
         ],
         body: { type: 'graphql', content: '{ "query": "", "variables": {} }' },
         isWebSocket: false,
         isPrivate: true
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

addJsonRpcRequest(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
       const request: Request = {
         id: this.generateId('req'),
         name: 'New JSON-RPC Request',
         method: 'POST',
         url: '',
         headers: [
           { key: 'Content-Type', value: 'application/json', enabled: true }
         ],
         body: {
           type: 'json',
           content: '{\n  "jsonrpc": "2.0",\n  "method": "example_method",\n  "params": {},\n  "id": 1\n}'
         },
         isJsonRpc: true,
         isWebSocket: false,
         isPrivate: true
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
const requestsStore = useRequestsStore();
requestsStore.selectRequest(request.id);
     },

addWebsocketRequest(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
       const request: Request = {
         id: this.generateId('req'),
         name: 'New WebSocket Request',
         method: 'GET',
         url: '',
         headers: [],
         body: { type: 'none', content: '' },
         isWebSocket: true,
         isPrivate: true
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

addShellCommand(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
        const request: Request = {
          id: this.generateId('req'),
          name: 'New Shell Command',
          method: 'SHELL',
          url: '',
          headers: [],
          body: { type: 'raw', content: '' },
          isWebSocket: false,
          preRequestScript: '',
          postRequestScript: '',
          testScript: '',
          isPrivate: true
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
        
        // Auto-select the newly created shell command
        const requestsStore = useRequestsStore();
        requestsStore.selectRequest(request.id);
      },

  addGrpcRequest(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
        const request: Request = {
          id: this.generateId('req'),
          name: 'New gRPC Request',
          method: 'POST',
          url: '',
          headers: [],
          body: { type: 'grpc', content: '' },
          isGrpc: true,
          isPrivate: true
        };

        if (targetType === 'collection') {
          const collection = this.collections.find((c: any) => c.id === targetId);
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

        // Auto-select the newly created gRPC request
        const requestsStore = useRequestsStore();
        requestsStore.selectRequest(request.id);
      },

  renameItem(id: string, newName: string) {
      logger.debug('[COLLECTIONS] renameItem called with id:', id, 'newName:', newName);
      // First check if it's a collection itself
      for (const collection of this.collections) {
        if (collection.id === id) {
          logger.debug('[COLLECTIONS] Renaming collection:', collection.name, 'to:', newName);
          collection.name = newName;
          this.saveCollections();
          return;
        }
      }

      // Then search within collection items
      for (const collection of this.collections) {
        const findAndRename = (items: any[]): boolean => {
          for (const item of items) {
            logger.debug('[COLLECTIONS] Checking item:', item.id, item.name, 'type:', 'method' in item ? 'request' : 'folder');
            if (item.id === id) {
              logger.debug('[COLLECTIONS] Found item to rename:', item.name, 'to:', newName);
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
          this.saveCollections();
          return;
        }
      }
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

    duplicateRequest(id: string) {
      const item = this.findItemById(id);
      if (item) {
        // Handle both {request: ...} wrapper and direct request objects
        const requestItem = 'request' in item && item.request ? item.request : item;
        if (requestItem && 'method' in requestItem) {
          const duplicated = { ...JSON.parse(JSON.stringify(requestItem)), id: this.generateId('req'), name: `${requestItem.name} (copy)` };
          const insertDuplicate = (items: any[]): boolean => {
            for (let i = 0; i < items.length; i++) {
              // Check both direct items and wrapped request items
              const currentItem = items[i];
              const checkItem = 'request' in currentItem && currentItem.request ? currentItem.request : currentItem;
              if (currentItem.id === id || (checkItem && checkItem.id === id)) {
                items.splice(i + 1, 0, duplicated);
                return true;
              }
              if ('items' in currentItem && currentItem.items) {
                if (insertDuplicate(currentItem.items)) {
                  return true;
                }
              }
            }
            return false;
          };
          for (const collection of this.collections) {
            if (insertDuplicate(collection.items)) {
              break;
            }
          }
          this.saveCollections();
        }
      }
    },

copyRequest(id: string) {
       const item = this.findItemById(id);
       const uiStore = useUIStore();
       if (item && 'method' in item) {
         uiStore.setCopiedRequest(item);
         navigator.clipboard.writeText(JSON.stringify(item, null, 2)).catch(() => {});
       }
     },

    pasteRequest(targetId: string, targetType: 'collection' | 'folder') {
      const uiStore = useUIStore();
      if (!uiStore.copiedRequest) return;

      const pasted = {
        ...JSON.parse(JSON.stringify(uiStore.copiedRequest)),
        id: this.generateId('req'),
        name: `${uiStore.copiedRequest.name} (copy)`
      };

      if (targetType === 'collection') {
        const collection = this.collections.find(c => c.id === targetId);
        if (collection) {
          collection.items.push(pasted);
        }
      } else {
        const findAndInsert = (items: any[]): boolean => {
          for (const item of items) {
            if (item.id === targetId && 'items' in item) {
              item.items.push(pasted);
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
        for (const collection of this.collections) {
          if (findAndInsert(collection.items)) {
            break;
          }
        }
      }
      this.saveCollections();
      uiStore.clearCopiedRequest();
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
       let sourceItem: any = null;
       let sourceContainer: any[] | null = null;
       let sourceIndex = -1;

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

       let sourceFound = false;
       for (const collection of this.collections) {
         if (findAndRemove(collection.items)) {
           sourceFound = true;
           break;
         }
       }

       if (!sourceItem) {
         return false;
       }

       let targetFound = false;
       if (targetContainerType === 'collection') {
         const targetCollection = this.collections.find(c => c.id === targetContainerId);
         if (targetCollection) {
           if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= targetCollection.items.length) {
             targetCollection.items.splice(targetIndex, 0, sourceItem);
           } else {
             targetCollection.items.push(sourceItem);
           }
           targetFound = true;
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

         for (const collection of this.collections) {
           if (findAndInsert(collection.items)) {
             targetFound = true;
             break;
           }
         }
       }

       if (targetFound) {
         this.saveCollections();
         return true;
       } else {
         if (sourceContainer && sourceIndex >= 0) {
           sourceContainer.splice(sourceIndex, 0, sourceItem);
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