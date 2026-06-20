import { defineStore } from 'pinia';
import type { RunConfig } from '../types';
import { useAppStore } from './index';
import { useSecretsStore } from './secrets';
import { useLoadTestStore } from './loadTest';

class RunnerScheduler {
  private _activeRun: RunConfig | null = null;

  get activeRun() {
    return this._activeRun;
  }

async startLoadTest(
      config: RunConfig,
      collections: any[],
      environments: any[],
      secrets: any[],
      isSecretsUnlocked: boolean,
      runId: string,
      activeEnvironmentId?: string | null
    ): Promise<void> {
      this._activeRun = config;

      try {
        // Run load test via IPC in main process
        await window.api.runLoadTest({
          config,
          collections,
          environments,
          secrets,
          isSecretsUnlocked,
          runId,
          activeEnvironmentId,
        });
      } finally {
        this._activeRun = null;
      }
    }

  stop(): void {
    this._activeRun = null;
  }
}

const scheduler = new RunnerScheduler();

export const useRunnerStore = defineStore('runner', {
  state: () => ({
    runConfigs: [] as RunConfig[],
    selectedConfigId: null as string | null,
    isRunning: false as boolean,
  }),

  getters: {
    activeRunConfig(): RunConfig | null {
      return this.runConfigs.find(c => c.id === this.selectedConfigId) || null;
    },

    scheduler(): RunnerScheduler {
      return scheduler;
    },
  },

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
    },

 async runLoadTest(
       config: RunConfig,
       collections: any[],
       environments: any[],
       activeEnvironmentId?: string | null
     ): Promise<void> {
        this.isRunning = true;
        try {
          const appStore = useAppStore();
          const secretsStore = useSecretsStore();
          const loadTestStore = useLoadTestStore();
          
          // Deep clone everything to remove Proxy objects
          const clonedConfig = JSON.parse(JSON.stringify(config));
          const clonedCollections = JSON.parse(JSON.stringify(collections));
          const clonedEnvironments = JSON.parse(JSON.stringify(environments));
          
          // Start the run in loadTestStore to establish currentRun for StatsPanel
          const run = await loadTestStore.startRun({
            name: clonedConfig.name,
            collectionId: clonedConfig.collectionId,
            collectionName: clonedConfig.collectionName || '',
            selectedRequests: clonedConfig.selectedRequests,
          });

          // Setup listener for live stats updates
          loadTestStore.setupStatsListener();

          const secrets = JSON.parse(JSON.stringify(appStore.secrets || []));
          const isSecretsUnlocked = secretsStore.isUnlocked || false;

          // Run the load test with the existing runId and requestConfigs for RPS
           await scheduler.startLoadTest(clonedConfig, clonedCollections, clonedEnvironments, secrets, isSecretsUnlocked, run.id, activeEnvironmentId);
          
          // End the run
          await loadTestStore.endRun(run.id);
        } finally {
          this.isRunning = false;
        }
      },

     stopRun(): void {
       window.api.stopLoadTest();
       scheduler.stop();
       this.isRunning = false;
     },
  }
});