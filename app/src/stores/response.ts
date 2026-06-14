import { defineStore } from 'pinia';
import type { Response, ResponseTab, TestStats } from '../types';

export const useResponseStore = defineStore('response', {
  state: () => ({
    response: null as Response | null,
    activeResponseTab: 'body' as ResponseTab,
    testResults: '',
    scriptSource: '',
    isLoading: false,
    testStats: { total: 0, passed: 0, failed: 0, avgTime: 0 } as TestStats,
  }),

  actions: {
    setResponse(response: Response | null) {
      this.response = response;
    },

    setTestResults(results: string, source?: string) {
      this.testResults = results;
      this.scriptSource = source || 'testScript';
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    updateTestStats(stats: TestStats) {
      this.testStats = stats;
    }
  }
});