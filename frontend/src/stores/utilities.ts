import { defineStore } from 'pinia';
import type { Utility } from '../types';
import { defaultUtilities } from '../utilities';
import { useAppStore } from './';

export const useUtilitiesStore = defineStore('utilities', {
  state: () => ({
    utilities: [] as Utility[],
    selectedUtilityId: null as string | null,
  }),

  actions: {
    generateId(prefix: string): string {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    addUtility() {
      const utility: Utility = {
        id: this.generateId('utility'),
        name: 'New Utility',
        icon: '🔧',
        command: '',
        postProcessScript: ''
      };
      this.utilities.push(utility);
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    updateUtility(utility: Utility) {
      const index = this.utilities.findIndex(u => u.id === utility.id);
      if (index !== -1) {
        this.utilities[index] = utility;
        const appStore = useAppStore();
        appStore.saveToLocalStorage();
      }
    },

    deleteUtility(id: string) {
      this.utilities = this.utilities.filter(u => u.id !== id);
      if (this.selectedUtilityId === id) {
        this.selectedUtilityId = null;
      }
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    selectUtility(id: string | null) {
      this.selectedUtilityId = id;
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    }
  }
});