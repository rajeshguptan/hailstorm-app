import { defineStore } from 'pinia';
import type { RunConfig } from '../types';
import { useAppStore } from './index';

export const useRunnerStore = defineStore('runner', {
  state: () => ({
    runConfigs: [] as RunConfig[],
    selectedConfigId: null as string | null,
  }),

  actions: {
    generateId(prefix: string): string {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    addRunConfig() {
      const config: RunConfig = {
        id: this.generateId('run'),
        name: 'New Run Config',
        collectionId: '',
        collectionName: '',
        selectedRequests: [],
        runMode: 'sequential',
        delay: 1000,
        runRepeated: false,
        iterations: 1
      };
      this.runConfigs.push(config);
      this.selectRunConfig(config.id);
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    selectRunConfig(id: string) {
      this.selectedConfigId = id;
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    updateRunConfig(config: RunConfig) {
      const index = this.runConfigs.findIndex(c => c.id === config.id);
      if (index !== -1) {
        this.runConfigs[index] = config;
      } else {
        this.runConfigs.push(config);
        this.selectedConfigId = config.id;
      }
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    deleteRunConfig(id: string) {
      this.runConfigs = this.runConfigs.filter(c => c.id !== id);
      if (this.selectedConfigId === id) {
        this.selectedConfigId = this.runConfigs.length > 0 ? this.runConfigs[0].id : null;
      }
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    }
  }
});