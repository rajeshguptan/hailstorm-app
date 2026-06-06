import { defineStore } from 'pinia';
import type { SidebarView } from '../types';

export const useUIStore = defineStore('ui', {
  state: () => ({
    activeSidebar: 'collections' as SidebarView,
    sidebarTitle: 'Collections',
    sidebarWidth: parseInt(localStorage.getItem('sidebarWidth') || '280'),

    requestPanelHeight: parseInt(localStorage.getItem('requestPanelHeight') || '300'),

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

    recentRequestCount: parseInt(localStorage.getItem('recentRequestCount') || '6'),
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
    },

    setRecentRequestCount(count: number) {
      this.recentRequestCount = Math.max(1, Math.min(50, count));
      localStorage.setItem('recentRequestCount', this.recentRequestCount.toString());
    },

    setRequestPanelHeight(height: number) {
      this.requestPanelHeight = Math.max(100, Math.min(800, height));
      localStorage.setItem('requestPanelHeight', this.requestPanelHeight.toString());
    }
  }
});