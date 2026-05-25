import { defineStore } from 'pinia';
import type { SidebarView } from '../types';

export const useUIStore = defineStore('ui', {
  state: () => ({
    activeSidebar: 'collections' as SidebarView,
    sidebarTitle: 'Collections',
    sidebarWidth: parseInt(localStorage.getItem('sidebarWidth') || '280'),

    contextMenu: {
      show: false,
      x: 0,
      y: 0,
      type: '',
      id: ''
    },

    showEnvModal: false,
    editingEnv: {
      id: '',
      name: '',
      variables: [],
      active: false
    } as any,

    showRenameModal: false,
    renameTarget: { id: '', currentName: '' } as { id: string; currentName: string },

    fileInput: null as HTMLInputElement | null,

    hoveredTreeItemId: '' as string,
  }),

  getters: {
    showSidebarMain: (state) => {
      return ['collections', 'environments', 'history', 'secrets', 'runner', 'settings'].includes(state.activeSidebar);
    }
  },

  actions: {
    showContextMenu(e: MouseEvent, type: string, id: string) {
      this.contextMenu.show = true;
      this.contextMenu.x = e.clientX;
      this.contextMenu.y = e.clientY;
      this.contextMenu.type = type;
      this.contextMenu.id = id;
    },

    hideContextMenu() {
      this.contextMenu.show = false;
    },

    setHoveredTreeItem(id: string) {
      this.hoveredTreeItemId = id;
    }
  }
});