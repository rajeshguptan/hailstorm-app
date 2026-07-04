<template>
  <div class="stats-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div class="stats-header px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <div class="flex items-center justify-between gap-3">
        <select
          v-model="selectedRunId"
          class="form-select bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 min-w-[220px] flex-1"
        >
          <option value="">Current Run (Live)</option>
          <option v-for="run in completedRuns" :key="run.id" :value="run.id">
            {{ run.name }} ({{ new Date(run.startTime).toLocaleString() }})
          </option>
        </select>
        <div class="flex gap-2">
          <button
            @click="printStats"
            class="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            :disabled="!currentRun && completedRuns.length === 0"
          >
            Print
          </button>
          <button
            @click="exportStats"
            class="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            :disabled="!selectedRunId && !currentRun"
          >
            Export JSON
          </button>
          <button
            @click="deleteRun(selectedRunId)"
            :disabled="!selectedRunId"
            class="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
          <button
            @click="deleteAllRuns"
            :disabled="completedRuns.length === 0"
            class="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete all
          </button>
        </div>
      </div>
    </div>

    <div class="stats-content flex-1 overflow-auto">
      <!-- Stats Overview Table -->
      <div v-if="currentStats" class="px-6 py-4">
        <h3 class="text-lg font-bold mb-4 text-zinc-900 dark:text-white">Overall Summary</h3>
        <div class="overflow-x-auto mb-8">
          <table class="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead class="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Requests</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Success</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Failures</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Median (p50)</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p75</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p90</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p99</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
              <tr>
                <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">{{ currentStats.totalRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-green-600 dark:text-green-400">{{ currentStats.successfulRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{{ currentStats.failedRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(overallPercentiles.p50) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(overallPercentiles.p75) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(overallPercentiles.p90) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(overallPercentiles.p99) }}ms</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Per-Request Stats Table -->
        <h3 v-if="statsByRequest.length > 0 || liveStatsByRequestTable.length > 0" class="text-lg font-bold mb-4 text-zinc-900 dark:text-white">By Request</h3>
        <div v-if="statsByRequest.length > 0 || liveStatsByRequestTable.length > 0" class="overflow-x-auto mb-8">
          <table class="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead class="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Request</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Requests</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Success</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Failures</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Median (p50)</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p75</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p90</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p99</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
              <tr v-for="stat in statsByRequest.length > 0 ? statsByRequest : liveStatsByRequestTable" :key="stat.requestName">
                <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">{{ stat.requestName }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ stat.totalRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-green-600 dark:text-green-400">{{ stat.successfulRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{{ stat.failedRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(stat.p50ResponseTime) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(stat.p75ResponseTime) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(stat.p90ResponseTime) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(stat.p99ResponseTime) }}ms</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Charts -->
        <div class="px-6 pb-4 space-y-6">
          <!-- Requests vs Time Chart -->
          <div class="chart-container bg-zinc-100 dark:bg-zinc-800 p-6 rounded shadow-sm">
            <div class="h-64">
              <Line
                v-if="requestsChartData"
                :data="requestsChartData"
                :options="requestsChartOptions"
              />
              <div v-else class="h-full flex items-center justify-center text-zinc-500">
                <div class="text-center">
                  <div class="text-4xl mb-2">📊</div>
                  <p class="font-medium">No Request Data</p>
                  <p class="text-sm">Run a load test to see request metrics</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Errors vs Time Chart (by HTTP Response Code) -->
          <div class="chart-container bg-zinc-100 dark:bg-zinc-800 p-6 rounded shadow-sm">
            <div class="h-64">
              <Bar
                v-if="statusChartData"
                :data="statusChartData"
                :options="statusChartOptions"
              />
              <Line
                v-else-if="errorsChartData"
                :data="errorsChartData"
                :options="errorsChartOptions"
              />
              <div v-else class="h-full flex items-center justify-center text-zinc-500">
                <div class="text-center">
                  <div class="text-4xl mb-2">✅</div>
                  <p class="font-medium">No Errors</p>
                  <p class="text-sm">Great! No 5xx errors detected</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Median Response Time vs Time Chart -->
          <div class="chart-container bg-zinc-100 dark:bg-zinc-800 p-6 rounded shadow-sm">
            <!-- Percentile Selector -->
            <div class="flex items-center gap-4 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-600">
              <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Percentile:</span>
              <div class="flex gap-2">
                <label v-for="percentile in percentiles" :key="percentile.value" class="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    :value="percentile.value"
                    v-model="selectedPercentile"
                    class="text-blue-500 focus:ring-blue-500"
                  />
                  <span class="text-sm text-zinc-600 dark:text-zinc-400">{{ percentile.label }}</span>
                </label>
              </div>
            </div>
            <div class="h-64">
              <Line
                v-if="responseTimeChartData"
                :data="responseTimeChartData"
                :options="responseTimeChartOptions"
              />
              <div v-else class="h-full flex items-center justify-center text-zinc-500">
                <div class="text-center">
                  <div class="text-4xl mb-2">⚡</div>
                  <p class="font-medium">No Response Time Data</p>
                  <p class="text-sm">Run a load test to see response time metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Stats for Current Run -->
      <div v-else-if="loadTestStore?.currentRun" class="px-6 py-4">
        <h3 class="text-lg font-bold mb-4 text-zinc-900 dark:text-white">Overall Summary (Live)</h3>
        <div class="overflow-x-auto mb-8">
          <table class="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead class="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Requests</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Success</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Failures</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Median (p50)</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p75</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p90</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p99</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
              <tr>
                <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">{{ loadTestStore.liveStats.totalRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-green-600 dark:text-green-400">{{ loadTestStore.liveStats.successfulRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{{ loadTestStore.liveStats.failedRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(overallPercentiles.p50) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(overallPercentiles.p75) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(overallPercentiles.p90) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(overallPercentiles.p99) }}ms</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 v-if="liveStatsByRequestTable.length > 0" class="text-lg font-bold mb-4 text-zinc-900 dark:text-white">By Request (Live)</h3>
        <div v-if="liveStatsByRequestTable.length > 0" class="overflow-x-auto mb-8">
          <table class="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead class="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Request</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Requests</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Success</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Failures</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Median (p50)</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p75</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p90</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">p99</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
              <tr v-for="stat in liveStatsByRequestTable" :key="stat.requestName">
                <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">{{ stat.requestName }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ stat.totalRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-green-600 dark:text-green-400">{{ stat.successfulRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{{ stat.failedRequests.toLocaleString() }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(stat.p50ResponseTime) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(stat.p75ResponseTime) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(stat.p90ResponseTime) }}ms</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">{{ formatPercentile(stat.p99ResponseTime) }}ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- No Data State -->
      <div v-else class="px-6 py-4 text-center text-zinc-500">
        <p class="text-lg mb-2">No load test data available</p>
        <p class="text-sm">Run a load test from the Runner panel to see statistics</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useLoadTestStore } from '../../stores/loadTest';
import type { LoadTestStats, LoadTestStatsByRequest, LoadTestTimeSeriesPoint, LoadTestTimeSeriesByRequestPoint, LoadTestTimeSeriesByStatusPoint, LoadTestRun } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const loadTestStore = useLoadTestStore();
const selectedRunId = ref('');
const currentStats = ref<LoadTestStats | null>(null);
const statsByRequest = ref<LoadTestStatsByRequest[]>([]);

const selectedPercentile = ref('p50');
const percentiles = [
  { value: 'mean', label: 'Mean' },
  { value: 'p75', label: '75th' },
  { value: 'p90', label: '90th' },
  { value: 'p95', label: '95th' },
  { value: 'p99', label: '99th' }
];

const completedRuns = ref<LoadTestRun[]>([]);
const currentRun = computed(() => loadTestStore.currentRun);

const liveStatsByRequestTable = computed(() => {
  const result: LoadTestStatsByRequest[] = [];
  const rollingWindow = loadTestStore.rollingWindowByRequest;
  
  for (const [requestName, points] of Object.entries(rollingWindow)) {
    const totalRequests = points.reduce((sum, p) => sum + p.requests, 0);
    const errors = points.reduce((sum, p) => sum + p.errors, 0);
    const latencies: number[] = [];
    
    for (const point of points) {
      for (let i = 0; i < point.requests; i++) {
        latencies.push(point.avgResponseTime);
      }
    }
    
    const percentiles = loadTestStore.calculatePercentiles(latencies);
    
    result.push({
      requestName,
      totalRequests,
      successfulRequests: totalRequests - errors,
      failedRequests: errors,
      p50ResponseTime: percentiles.p50,
      p75ResponseTime: percentiles.p75,
      p90ResponseTime: percentiles.p90,
      p95ResponseTime: percentiles.p95,
      p99ResponseTime: percentiles.p99
    });
  }
  
  return result.sort((a, b) => a.requestName.localeCompare(b.requestName));
});

const overallPercentiles = computed(() => {
  if (!currentStats.value || currentStats.value.p50ResponseTime === 0) {
    const rollingWindow = loadTestStore.rollingWindow;
    if (rollingWindow.length > 0) {
      const allResponseTimes: number[] = [];
      rollingWindow.forEach(p => {
        for (let i = 0; i < p.requests; i++) {
          allResponseTimes.push(p.avgResponseTime);
        }
      });
      return loadTestStore.calculatePercentiles(allResponseTimes);
    }
  }
  return {
    p50: currentStats.value?.p50ResponseTime || 0,
    p75: currentStats.value?.p75ResponseTime || 0,
    p90: currentStats.value?.p90ResponseTime || 0,
    p95: currentStats.value?.p95ResponseTime || 0,
    p99: currentStats.value?.p99ResponseTime || 0
  };
});

type ChartPoint = { x: number; y: number };
type ChartDataset = { label: string; data: ChartPoint[]; [key: string]: any };

const runStartTime = computed(() => currentStats.value?.startTime || loadTestStore.liveStats.startTime || 0);
const runDurationMs = computed(() => {
  if (currentStats.value?.duration !== undefined) return currentStats.value.duration;
  if (currentRun.value?.duration) {
    return Math.min(Date.now() - currentRun.value.startTime, currentRun.value.duration * 1000);
  }
  return currentRun.value ? Date.now() - currentRun.value.startTime : 0;
});
const runDurationSeconds = computed(() => Math.max(0, runDurationMs.value / 1000));

function getElapsedSeconds(timestamp: number): number {
  const start = runStartTime.value || timestamp;
  return Math.max(0, (timestamp - start) / 1000);
}

async function updateCurrentStats() {
   try {
     if (selectedRunId.value) {
       currentStats.value = await loadTestStore.getRunStats(selectedRunId.value);
       statsByRequest.value = await loadTestStore.getRunStatsByRequest(selectedRunId.value);
     } else if (currentRun.value) {
       const liveStats = loadTestStore.liveStats;
       const elapsedMs = Date.now() - liveStats.startTime;
       const durationMs = currentRun.value.duration ? Math.min(elapsedMs, currentRun.value.duration * 1000) : elapsedMs;
       currentStats.value = {
         runId: currentRun.value.id,
         totalRequests: liveStats.totalRequests,
         successfulRequests: liveStats.successfulRequests,
         failedRequests: liveStats.failedRequests,
         errorRate: liveStats.totalRequests > 0 ? (liveStats.failedRequests / liveStats.totalRequests) * 100 : 0,
         avgResponseTime: liveStats.avgResponseTime,
         minResponseTime: 0,
         maxResponseTime: 0,
         p50ResponseTime: 0,
         p75ResponseTime: 0,
         p90ResponseTime: 0,
         p95ResponseTime: 0,
         p99ResponseTime: 0,
         requestsPerSecond: liveStats.requestsPerSecond,
         startTime: liveStats.startTime,
         endTime: currentRun.value.duration ? liveStats.startTime + durationMs : Date.now(),
         duration: durationMs
       };
     } else {
       currentStats.value = null;
     }
   } catch (error) {
     console.error('Failed to update current stats:', error);
     currentStats.value = null;
   }
 }

// Time series data for charts
const timeSeriesData = ref<LoadTestTimeSeriesPoint[]>([]);
const timeSeriesByRequestData = ref<LoadTestTimeSeriesByRequestPoint[]>([]);
const timeSeriesByStatusData = ref<LoadTestTimeSeriesByStatusPoint[]>([]);

  // Load time series data
  async function loadTimeSeriesData() {
    if (selectedRunId.value) {
      // Load historical data for selected run
      timeSeriesData.value = await loadTestStore.getTimeSeriesData(selectedRunId.value);
      timeSeriesByRequestData.value = await loadTestStore.getTimeSeriesDataByRequest(selectedRunId.value);
      timeSeriesByStatusData.value = await loadTestStore.getTimeSeriesDataByStatus(selectedRunId.value);
    } else {
      // Live data from rolling window
      timeSeriesData.value = [...loadTestStore.rollingWindow];
      // Build by-request data from rolling window
      timeSeriesByRequestData.value = Object.entries(loadTestStore.rollingWindowByRequest)
        .filter(([requestName]) => requestName)
        .flatMap(([requestName, points]) =>
          points.map(point => ({
            requestName,
            timestamp: point.timestamp,
            requests: point.requests,
            errors: point.errors,
            avgResponseTime: point.avgResponseTime,
            p50ResponseTime: point.p50ResponseTime,
            p75ResponseTime: point.p75ResponseTime,
            p90ResponseTime: point.p90ResponseTime,
            p95ResponseTime: point.p95ResponseTime,
            p99ResponseTime: point.p99ResponseTime
          }))
        );
      // Build by-status data from rolling window
      timeSeriesByStatusData.value = Object.entries(loadTestStore.rollingWindowByStatus)
        .filter(([statusCode]) => statusCode)
        .flatMap(([statusCode, points]) =>
          points.map(point => ({
            statusCode: parseInt(statusCode),
            timestamp: point.timestamp,
            requests: point.requests,
            avgResponseTime: 0,
            p50ResponseTime: 0,
            p75ResponseTime: 0,
            p90ResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0
          }))
        );
    }
  }

// Chart data processing for aggregated view
const chartData = computed(() => {
  const data = timeSeriesData.value;
  if (data.length === 0) return null;

  const points = data.map(point => ({
    elapsedSeconds: getElapsedSeconds(point.timestamp),
    point
  }));

  return {
    labels: points.map(point => formatDuration(point.elapsedSeconds * 1000)),
    requests: points.map(point => ({
      x: point.elapsedSeconds,
      y: point.point.requests
    })),
    errors: points.map(point => ({
      x: point.elapsedSeconds,
      y: point.point.errors
    })),
    responseTime: points.map(point => ({
      x: point.elapsedSeconds,
      y: getResponseTimeValue(point.point, selectedPercentile.value)
    }))
  };
});

// Chart data processing for by-request view
const chartDataByRequest = computed(() => {
  const data = timeSeriesByRequestData.value;
  if (data.length === 0) return null;

  // Group data by timestamp for consistent time buckets
  const timeBuckets: { [key: number]: { [key: string]: { requests: number; errors: number; avgResponseTime: number } } } = {};

  data.forEach(point => {
    if (!timeBuckets[point.timestamp]) {
      timeBuckets[point.timestamp] = {};
    }
    timeBuckets[point.timestamp][point.requestName] = {
      requests: point.requests,
      errors: point.errors,
      avgResponseTime: point.avgResponseTime
    };
  });

  // Get all unique request names
  const requestNames = [...new Set(data.map(point => point.requestName))].sort();

  // Create labels from timestamps
  const timestamps = Object.keys(timeBuckets).sort((a, b) => parseInt(a) - parseInt(b));
  const labels = timestamps.map(timestamp => formatDuration(getElapsedSeconds(parseInt(timestamp)) * 1000));

  return {
    labels,
    timestamps,
    timeBuckets,
    requestNames
  };
});

const progressiveLineAnimation = {
  x: {
    type: 'number' as const,
    easing: 'linear' as const,
    duration: (ctx: any) => Math.max(0, (ctx.chart.animatedData?.length || 0) * 50),
    from: NaN
  },
  y: {
    type: 'number' as const,
    easing: 'linear' as const,
    duration: (ctx: any) => Math.max(0, (ctx.chart.animatedData?.length || 0) * 50),
    from: 0
  }
};

const xAxisOptions = computed(() => ({
  type: 'linear' as const,
  min: 0,
  max: Math.max(1, runDurationSeconds.value),
  title: {
    display: true,
    text: `Elapsed Time (run duration: ${formatDuration(currentStats.value?.duration || 0)})`
  },
  ticks: {
    callback: (value: number | string) => formatDuration(Number(value) * 1000)
  },
  grid: {
    display: false
  }
}));

const countTooltipCallbacks = {
  title: (items: any[]) => `Elapsed: ${formatDuration((items[0]?.parsed?.x || 0) * 1000)}`,
  label: (context: any) => `${context.dataset.label}: ${context.parsed.y}`
};

const responseTimeTooltipCallbacks = {
  title: (items: any[]) => `Elapsed: ${formatDuration((items[0]?.parsed?.x || 0) * 1000)}`,
  label: (context: any) => `${context.dataset.label}: ${context.parsed.y}ms`
};

const requestsChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'left' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    title: {
      display: true,
      text: 'Requests over Run Duration' + (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0 ? ' (by Request Name)' : ''),
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: countTooltipCallbacks
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Number of Requests'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: xAxisOptions.value
  },
  animation: progressiveLineAnimation,
  elements: {
    point: {
      radius: 3,
      hoverRadius: 6
    },
    line: {
      borderWidth: 3
    }
  }
}));

const errorsChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'left' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    title: {
      display: true,
      text: 'Errors over Run Duration' + (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0 ? ' (by Request Name)' : ''),
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: countTooltipCallbacks
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Number of Errors'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: xAxisOptions.value
  },
  animation: progressiveLineAnimation,
  elements: {
    point: {
      radius: 3,
      hoverRadius: 6
    },
    line: {
      borderWidth: 3
    }
  }
}));

const responseTimeChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'left' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    title: {
      display: true,
      text: `Response Time (${percentiles.find(p => p.value === selectedPercentile.value)?.label || 'Mean'})` + (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0 ? ' (by Request Name)' : ''),
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: responseTimeTooltipCallbacks
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Response Time (ms)'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: xAxisOptions.value
  },
  animation: progressiveLineAnimation,
  elements: {
    point: {
      radius: 3,
      hoverRadius: 6
    },
    line: {
      borderWidth: 3
    }
  }
}));

// Color schemes for different metrics
const colorSchemes = {
  requests: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500
    borderColor: 'rgb(59, 130, 246)',
    hoverBackgroundColor: 'rgba(59, 130, 246, 1)'
  },
  errors: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)', // red-500
    borderColor: 'rgb(239, 68, 68)',
    hoverBackgroundColor: 'rgba(239, 68, 68, 1)'
  },
  responseTime: {
    borderColor: 'rgb(34, 197, 94)', // green-500
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    hoverBorderColor: 'rgb(34, 197, 94)',
    pointBackgroundColor: 'rgb(34, 197, 94)',
    pointHoverBackgroundColor: 'rgb(34, 197, 94)'
  }
};

// Helper function to get response time value based on selected percentile
function getResponseTimeValue(point: any, percentile: string): number {
  if (!point) return 0;

  switch (percentile) {
    case 'mean':
      return point.avgResponseTime || 0;
    case 'p50':
      return point.p50ResponseTime ?? point.avgResponseTime ?? 0;
    case 'p75':
      return point.p75ResponseTime ?? point.avgResponseTime ?? 0;
    case 'p90':
      return point.p90ResponseTime ?? point.avgResponseTime ?? 0;
    case 'p95':
      return point.p95ResponseTime ?? point.avgResponseTime ?? 0;
    case 'p99':
      return point.p99ResponseTime ?? point.avgResponseTime ?? 0;
    default:
      return point.avgResponseTime || 0;
  }
}

  // Chart data objects
  const requestsChartData = computed((): ChartDataset | null => {
    // Show by-request view if available (for both live and historical data)
    if (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0) {
      const { timestamps, timeBuckets, requestNames } = chartDataByRequest.value;

      // Create color palette for different request names
      const colors = [
        { backgroundColor: 'rgba(59, 130, 246, 0.8)', borderColor: 'rgb(59, 130, 246)', hoverBackgroundColor: 'rgba(59, 130, 246, 1)' }, // blue
        { backgroundColor: 'rgba(16, 185, 129, 0.8)', borderColor: 'rgb(16, 185, 129)', hoverBackgroundColor: 'rgba(16, 185, 129, 1)' }, // green
        { backgroundColor: 'rgba(245, 158, 11, 0.8)', borderColor: 'rgb(245, 158, 11)', hoverBackgroundColor: 'rgba(245, 158, 11, 1)' }, // amber
        { backgroundColor: 'rgba(239, 68, 68, 0.8)', borderColor: 'rgb(239, 68, 68)', hoverBackgroundColor: 'rgba(239, 68, 68, 1)' }, // red
        { backgroundColor: 'rgba(139, 92, 246, 0.8)', borderColor: 'rgb(139, 92, 246)', hoverBackgroundColor: 'rgba(139, 92, 246, 1)' }, // violet
        { backgroundColor: 'rgba(236, 72, 153, 0.8)', borderColor: 'rgb(236, 72, 153)', hoverBackgroundColor: 'rgba(236, 72, 153, 1)' }, // pink
      ];

      const datasets = requestNames.map((requestName, index) => {
        const colorIndex = index % colors.length;
        const color = colors[colorIndex];

        const data = timestamps.map(timestamp => ({
          x: getElapsedSeconds(parseInt(timestamp)),
          y: timeBuckets[parseInt(timestamp)]?.[requestName]?.requests || 0
        }));

    return {
      label: requestName,
      data,
      ...color,
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 6,
    };
      });

      return {
        labels: [],
        datasets
      };
    } else if (chartData.value) {
      // Fallback to aggregated view for historical data
      return {
        labels: [],
        datasets: [{
          label: 'Total Requests',
          data: chartData.value.requests,
          ...colorSchemes.requests,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
        }]
      };
    }

    return null;
  });

const errorsChartData = computed((): ChartDataset[] | null => {
  // For live and historical data, show by-request view if available
  const hasLiveOrHistoricalData = !selectedRunId.value;
  if (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0) {
    const { timestamps, timeBuckets, requestNames } = chartDataByRequest.value;

    // Create color palette for different request names
    const colors = [
      { backgroundColor: 'rgba(239, 68, 68, 0.8)', borderColor: 'rgb(239, 68, 68)', hoverBackgroundColor: 'rgba(239, 68, 68, 1)' }, // red
      { backgroundColor: 'rgba(245, 101, 101, 0.8)', borderColor: 'rgb(245, 101, 101)', hoverBackgroundColor: 'rgba(245, 101, 101, 1)' }, // red-400
      { backgroundColor: 'rgba(248, 113, 113, 0.8)', borderColor: 'rgb(248, 113, 113)', hoverBackgroundColor: 'rgba(248, 113, 113, 1)' }, // red-300
      { backgroundColor: 'rgba(252, 165, 165, 0.8)', borderColor: 'rgb(252, 165, 165)', hoverBackgroundColor: 'rgba(252, 165, 165, 1)' }, // red-200
      { backgroundColor: 'rgba(254, 202, 202, 0.8)', borderColor: 'rgb(254, 202, 202)', hoverBackgroundColor: 'rgba(254, 202, 202, 1)' }, // red-100
      { backgroundColor: 'rgba(254, 226, 226, 0.8)', borderColor: 'rgb(254, 226, 226)', hoverBackgroundColor: 'rgba(254, 226, 226, 1)' }, // red-50
    ];

    const datasets = requestNames.map((requestName, index) => {
      const colorIndex = index % colors.length;
      const color = colors[colorIndex];

      const data = timestamps.map(timestamp => ({
        x: getElapsedSeconds(parseInt(timestamp)),
        y: timeBuckets[parseInt(timestamp)]?.[requestName]?.errors || 0
      }));

      // For live runs, show all requests; for historical, only show requests with errors
      if (!hasLiveOrHistoricalData) {
        const hasErrors = data.some(val => val.y > 0);
        if (!hasErrors) return null;
      }

      return {
        label: requestName,
        data,
        ...color,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
      };
    }).filter(dataset => dataset !== null) as ChartDataset[];

    if (datasets.length > 0) {
      return {
        labels: [],
        datasets
      };
    }
  }

  // Fallback to aggregated view for historical data or when no by-request errors
  if (chartData.value) {
    return {
      labels: [],
      datasets: [{
        label: 'Errors (5xx)',
        data: chartData.value.errors,
        ...colorSchemes.errors,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
      }]
    };
  }

  return null;
});

// Chart data processing for by-status view (stacked bar chart)
const chartDataByStatus = computed(() => {
  const data = timeSeriesByStatusData.value;
  if (data.length === 0) return null;

  // Group data by timestamp for consistent time buckets
  const timeBuckets: { [key: number]: { [key: number]: { requests: number } } } = {};

  data.forEach(point => {
    if (!timeBuckets[point.timestamp]) {
      timeBuckets[point.timestamp] = {};
    }
    timeBuckets[point.timestamp][point.statusCode] = {
      requests: point.requests
    };
  });

  // Get all unique status codes
  const statusCodes = [...new Set(data.map(point => point.statusCode))].sort((a, b) => a - b);

  // Create labels from timestamps
  const timestamps = Object.keys(timeBuckets).sort((a, b) => parseInt(a) - parseInt(b));

  return {
    labels: [],
    timestamps,
    timeBuckets,
    statusCodes
  };
});

// Status chart data for stacked bar chart
const statusChartData = computed(() => {
  if (chartDataByStatus.value && chartDataByStatus.value.statusCodes.length > 0) {
    const { timestamps, timeBuckets, statusCodes } = chartDataByStatus.value;

    // Define colors for different status categories
    const getStatusColor = (statusCode: number): { backgroundColor: string; borderColor: string } => {
      if (statusCode >= 200 && statusCode < 300) {
        return { backgroundColor: 'rgba(34, 197, 94, 0.8)', borderColor: 'rgb(34, 197, 94)' }; // green - 2xx
      } else if (statusCode >= 300 && statusCode < 400) {
        return { backgroundColor: 'rgba(59, 130, 246, 0.8)', borderColor: 'rgb(59, 130, 246)' }; // blue - 3xx
      } else if (statusCode >= 400 && statusCode < 500) {
        return { backgroundColor: 'rgba(245, 158, 11, 0.8)', borderColor: 'rgb(245, 158, 11)' }; // amber - 4xx
      } else if (statusCode >= 500) {
        return { backgroundColor: 'rgba(239, 68, 68, 0.8)', borderColor: 'rgb(239, 68, 68)' }; // red - 5xx
      } else {
        return { backgroundColor: 'rgba(107, 114, 128, 0.8)', borderColor: 'rgb(107, 114, 128)' }; // gray - others
      }
    };

    const datasets = statusCodes.map(statusCode => {
      const color = getStatusColor(statusCode);
      const label = statusCode === 0 ? 'Network Error' : `${statusCode}`;

      const data = timestamps.map(timestamp => ({
        x: getElapsedSeconds(parseInt(timestamp)),
        y: timeBuckets[parseInt(timestamp)]?.[statusCode]?.requests || 0
      }));

      // Only include datasets that have data
      if (!data.some(d => d.y > 0)) return null;

      return {
        label,
        data,
        backgroundColor: color.backgroundColor,
        borderColor: color.borderColor,
        borderWidth: 1,
      };
    }).filter(dataset => dataset !== null) as ChartDataset[];

    if (datasets.length > 0) {
      return {
        labels: [],
        datasets
      };
    }
  }

  return null;
});

const statusChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'left' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        generateLabels: (chart: any) => {
          const datasets = chart.data.datasets;
          return datasets.map((ds: any, i: number) => ({
            text: ds.label,
            fillStyle: ds.backgroundColor,
            strokeStyle: ds.borderColor,
            hidden: false,
            index: i
          }));
        }
      }
    },
    title: {
      display: true,
      text: 'Responses by HTTP Status Code',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: countTooltipCallbacks
    }
  },
  scales: {
    x: {
      stacked: true,
      type: 'linear' as const,
      min: 0,
      max: Math.max(1, runDurationSeconds.value),
      title: {
        display: true,
        text: `Elapsed Time (run duration: ${formatDuration(currentStats.value?.duration || 0)})`
      },
      ticks: {
        callback: (value: number | string) => formatDuration(Number(value) * 1000)
      },
      grid: {
        display: false
      }
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Number of Responses'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    }
  },
  animation: progressiveLineAnimation
}));

const responseTimeChartData = computed(() => {
  // For live and historical data, show by-request view if available
  if (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0) {
    const { timestamps, timeBuckets, requestNames } = chartDataByRequest.value;

    // Create color palette for different request names
    const colors = [
      { borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', hoverBorderColor: 'rgb(34, 197, 94)', pointBackgroundColor: 'rgb(34, 197, 94)', pointHoverBackgroundColor: 'rgb(34, 197, 94)' }, // green
      { borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', hoverBorderColor: 'rgb(59, 130, 246)', pointBackgroundColor: 'rgb(59, 130, 246)', pointHoverBackgroundColor: 'rgb(59, 130, 246)' }, // blue
      { borderColor: 'rgb(245, 158, 11)', backgroundColor: 'rgba(245, 158, 11, 0.1)', hoverBorderColor: 'rgb(245, 158, 11)', pointBackgroundColor: 'rgb(245, 158, 11)', pointHoverBackgroundColor: 'rgb(245, 158, 11)' }, // amber
      { borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.1)', hoverBorderColor: 'rgb(239, 68, 68)', pointBackgroundColor: 'rgb(239, 68, 68)', pointHoverBackgroundColor: 'rgb(239, 68, 68)' }, // red
      { borderColor: 'rgb(139, 92, 246)', backgroundColor: 'rgba(139, 92, 246, 0.1)', hoverBorderColor: 'rgb(139, 92, 246)', pointBackgroundColor: 'rgb(139, 92, 246)', pointHoverBackgroundColor: 'rgb(139, 92, 246)' }, // violet
      { borderColor: 'rgb(236, 72, 153)', backgroundColor: 'rgba(236, 72, 153, 0.1)', hoverBorderColor: 'rgb(236, 72, 153)', pointBackgroundColor: 'rgb(236, 72, 153)', pointHoverBackgroundColor: 'rgb(236, 72, 153)' }, // pink
    ];

    const datasets = requestNames.map((requestName, index) => {
      const colorIndex = index % colors.length;
      const color = colors[colorIndex];

      const data = timestamps.map(timestamp => ({
        x: getElapsedSeconds(parseInt(timestamp)),
        y: getResponseTimeValue(timeBuckets[parseInt(timestamp)]?.[requestName], selectedPercentile.value)
      }));

      return {
        label: requestName,
        data,
        ...color,
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return {
      labels: [],
      datasets
    };
  } else if (chartData.value) {
    // Fallback to aggregated view for historical data
    return {
      labels: [],
      datasets: [{
        label: `Response Time (${percentiles.find(p => p.value === selectedPercentile.value)?.label || 'Mean'})`,
        data: timeSeriesData.value.map(point => ({
          x: getElapsedSeconds(point.timestamp),
          y: getResponseTimeValue(point, selectedPercentile.value)
        })),
        ...colorSchemes.responseTime,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    };
  }

  return null;
});

// Watch for run selection changes
watch(selectedRunId, async (newRunId) => {
  await updateCurrentStats();
  await loadTimeSeriesData();
});

// Watch for current run changes
watch(currentRun, async () => {
  if (!selectedRunId.value) {
    await updateCurrentStats();
    await loadTimeSeriesData();
  }
});

  // Watch for rolling window changes (live data updates)
  watch(() => loadTestStore.rollingWindow, async () => {
    if (!selectedRunId.value) {
      await updateCurrentStats();
      await loadTimeSeriesData();
    }
  }, { deep: true });

// Watch for by-request rolling window changes
   watch(() => loadTestStore.rollingWindowByRequest, async () => {
     if (!selectedRunId.value) {
       await updateCurrentStats();
       await loadTimeSeriesData();
     }
   }, { deep: true });

   // Watch for by-status rolling window changes
   watch(() => loadTestStore.rollingWindowByStatus, async () => {
     if (!selectedRunId.value) {
       await updateCurrentStats();
       await loadTimeSeriesData();
     }
   }, { deep: true });

// Initial data load
onMounted(async () => {
  try {
    await loadTestStore.initialize();
    completedRuns.value = await loadTestStore.getCompletedRuns();
    await updateCurrentStats();
    await loadTimeSeriesData();
  } catch (error) {
    console.error('Failed to initialize load test store:', error);
    completedRuns.value = [];
    currentStats.value = null;
    timeSeriesData.value = [];
  }
});

function formatPercentile(ms: number): string {
   if (ms === 0) return '0';
   if (ms < 10) return ms.toFixed(1);
   if (ms < 100) return Math.round(ms).toString();
   return Math.round(ms).toLocaleString();
 }

 function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function printStats() {
  window.print();
}

async function exportStats() {
  if (!selectedRunId.value && !currentRun.value) return;

  const runId = selectedRunId.value || currentRun.value!.id;
  const exportData = await loadTestStore.exportRunData(runId);

  if (exportData) {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `load-test-${runId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

async function deleteRun(runId: string) {
  if (confirm('Are you sure you want to delete this run and all its data?')) {
    try {
      await loadTestStore.deleteRun(runId);
      selectedRunId.value = '';
      await refreshCompletedRuns();
      await updateCurrentStats();
      await loadTimeSeriesData();
    } catch (error) {
      console.error('Failed to delete run:', error);
      alert('Failed to delete run');
    }
  }
}

async function deleteAllRuns() {
  if (confirm('Are you sure you want to delete all completed runs and their data?')) {
    try {
      for (const run of [...completedRuns.value]) {
        await loadTestStore.deleteRun(run.id);
      }
      selectedRunId.value = '';
      await refreshCompletedRuns();
      await updateCurrentStats();
      await loadTimeSeriesData();
    } catch (error) {
      console.error('Failed to delete all runs:', error);
      alert('Failed to delete all runs');
    }
  }
}

async function refreshCompletedRuns() {
  completedRuns.value = await loadTestStore.getCompletedRuns();
}


</script>

<style scoped>
.stat-card {
  min-height: 60px;
}

.chart-container {
  border: 1px solid #e5e7eb;
}

.dark .chart-container {
  border-color: #374151;
}

@media print {
  .stats-header button {
    display: none;
  }

  .stats-panel {
    background: white !important;
    color: black !important;
  }

  .stat-card {
    background: #f9fafb !important;
    border: 1px solid #e5e7eb !important;
  }
}
</style>