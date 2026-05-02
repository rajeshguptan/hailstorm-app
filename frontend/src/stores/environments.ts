import { defineStore } from 'pinia';
import type { Environment } from '../types';
import { useAppStore } from './index';

export const useEnvironmentsStore = defineStore('environments', {
  state: () => ({
    environments: [] as Environment[],
    activeEnvironmentId: null as string | null,
  }),

  getters: {
    activeEnvironment: (state) => {
      return state.environments.find(e => e.id === state.activeEnvironmentId) || null;
    }
  },

  actions: {
    generateId(prefix: string): string {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    addEnvironment() {
      const env: Environment = {
        id: this.generateId('env'),
        name: 'New Environment',
        variables: [],
        active: false
      };
      this.environments.push(env);
      this.selectEnvironment(env.id);
    },

    selectEnvironment(id: string) {
      console.log('[ENVIRONMENTS] selectEnvironment called with id:', id);
      this.activeEnvironmentId = id;
      this.environments.forEach(e => e.active = e.id === id);
    },

    updateEnvironment(env: Environment) {
      const index = this.environments.findIndex(e => e.id === env.id);
      if (index !== -1) {
        this.environments[index] = env;
      }
    },

    deleteEnvironment(id: string) {
      this.environments = this.environments.filter(e => e.id !== id);
      if (this.activeEnvironmentId === id) {
        this.activeEnvironmentId = null;
      }
    },

    saveEnvironment() {
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    }
  }
});