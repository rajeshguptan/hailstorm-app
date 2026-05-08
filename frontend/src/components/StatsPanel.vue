<template>
  <div class="stats-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div class="stats-header px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-zinc-900 dark:text-white">Load Test Stats</h3>
        <div class="flex gap-2">
          <button
            @click="printStats"
            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            :disabled="!currentRun"
          >
            Print
          </button>
          <button
            @click="exportStats"
            class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            :disabled="!currentRun"
          >
            Export JSON
          </button>
          </div>
        </div>
      </div>

    <div class="stats-content flex-1 overflow-auto">
      <!-- Run Selector -->
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 flex-1">
            <label class="text-sm text-zinc-600 dark:text-gray-400 whitespace-nowrap">Select Run</label>
            <select
              v-model="selectedRunId"
              class="form-select bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1"
            >
              <option value="">Current Run (Live)</option>
              <option v-for="run in completedRuns" :key="run.id" :value="run.id">
                {{ run.name }} ({{ new Date(run.startTime).toLocaleString() }})
              </option>
            </select>
          </div>
           <div class="flex items-center gap-2">
             <button
               @click="deleteRun(selectedRunId)"
               :disabled="!selectedRunId || completedRuns.length === 0"
               class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Delete Run
             </button>
           </div>
        </div>
      </div>

      <!-- Stats Overview -->
      <div v-if="currentStats" class="px-6 py-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
            <div class="text-xs text-zinc-500">Total Requests</div>
            <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ currentStats?.totalRequests?.toLocaleString() || 0 }}</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
            <div class="text-xs text-zinc-500">Successful</div>
            <div class="text-xl font-bold text-green-600 dark:text-green-400">{{ currentStats?.successfulRequests?.toLocaleString() || 0 }}</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
            <div class="text-xs text-zinc-500">Failed</div>
            <div class="text-xl font-bold text-red-600 dark:text-red-400">{{ currentStats?.failedRequests?.toLocaleString() || 0 }}</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
            <div class="text-xs text-zinc-500">Total Requests</div>
            <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ currentStats?.totalRequests?.toLocaleString() || 0 }}</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
            <div class="text-xs text-zinc-500">Successful</div>
            <div class="text-xl font-bold text-green-600 dark:text-green-400">{{ currentStats?.successfulRequests?.toLocaleString() || 0 }}</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
            <div class="text-xs text-zinc-500">Failed</div>
            <div class="text-xl font-bold text-red-600 dark:text-red-400">{{ currentStats?.failedRequests?.toLocaleString() || 0 }}</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
            <div class="text-xs text-zinc-500">Error Rate</div>
            <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ currentStats?.errorRate?.toFixed(2) || '0.00' }}%</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
            <div class="text-xs text-zinc-500">Duration</div>
            <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ formatDuration(currentStats?.duration || 0) }}</div>
          </div>
        </div>

        <!-- Charts -->
        <div class="px-6 pb-4 space-y-6">
          <!-- Requests vs Time Chart -->
          <div class="chart-container bg-zinc-100 dark:bg-zinc-800 p-6 rounded shadow-sm">
            <div class="h-64">
              <Bar
                v-if="requestsChartData"
                :data="requestsChartData"
                :options="requestsChartOptions"
                :key="'requests-' + timeSeriesData.length + '-' + timeSeriesByRequestData.length"
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

          <!-- Errors vs Time Chart -->
          <div class="chart-container bg-zinc-100 dark:bg-zinc-800 p-6 rounded shadow-sm">
            <div class="h-64">
              <Bar
                v-if="errorsChartData"
                :data="errorsChartData"
                :options="errorsChartOptions"
                :key="'errors-' + timeSeriesData.length + '-' + timeSeriesByRequestData.length"
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
                :key="'response-time-' + timeSeriesData.length + '-' + timeSeriesByRequestData.length"
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
        <div class="text-center text-zinc-500">
          <p class="text-lg mb-2">Load test in progress...</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
              <div class="text-xs text-zinc-500">Total Requests</div>
              <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ loadTestStore.liveStats.totalRequests.toLocaleString() }}</div>
            </div>
            <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
              <div class="text-xs text-zinc-500">Successful</div>
              <div class="text-xl font-bold text-green-600 dark:text-green-400">{{ loadTestStore.liveStats.successfulRequests.toLocaleString() }}</div>
            </div>
            <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
              <div class="text-xs text-zinc-500">Failed</div>
              <div class="text-xl font-bold text-red-600 dark:text-red-400">{{ loadTestStore.liveStats.failedRequests.toLocaleString() }}</div>
            </div>
            <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-4 rounded">
              <div class="text-xs text-zinc-500">Requests/sec</div>
              <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ loadTestStore.liveStats.requestsPerSecond.toFixed(1) }}</div>
            </div>
          </div>
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
import { useLoadTestStore } from '../stores/loadTest';
import type { LoadTestStats, LoadTestTimeSeriesPoint, LoadTestTimeSeriesByRequestPoint, LoadTestRun } from '../types';
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
import { Bar, Line } from 'vue-chartjs';

// Register Chart.js components
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

// Percentile selection for response time charts
const selectedPercentile = ref('p50');
const percentiles = [
  { value: 'mean', label: 'Mean' },
  { value: 'p75', label: '75th' },
  { value: 'p90', label: '90th' },
  { value: 'p95', label: '95th' },
  { value: 'p99', label: '99th' }
];

// Get completed runs
const completedRuns = ref<LoadTestRun[]>([]);



// Make sure store is reactive to changes
const currentRun = computed(() => loadTestStore.currentRun);

// Function to update current stats
async function updateCurrentStats() {
  try {
    if (selectedRunId.value) {
      currentStats.value = await loadTestStore.getRunStats(selectedRunId.value);
    } else if (currentRun.value) {
      // Return live stats for current run
      const liveStats = loadTestStore.liveStats;
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
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        requestsPerSecond: liveStats.requestsPerSecond,
        startTime: liveStats.startTime,
        endTime: Date.now(),
        duration: Date.now() - liveStats.startTime
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

  // Load time series data
  async function loadTimeSeriesData() {
    if (selectedRunId.value) {
      // Load historical data for selected run
      timeSeriesData.value = await loadTestStore.getTimeSeriesData(selectedRunId.value);
      timeSeriesByRequestData.value = await loadTestStore.getTimeSeriesDataByRequest(selectedRunId.value);
    } else {
      // Live data from rolling window
      timeSeriesData.value = [...loadTestStore.rollingWindow];
      // Build by-request data from rolling window
      timeSeriesByRequestData.value = Object.entries(loadTestStore.rollingWindowByRequest).flatMap(([requestName, points]) =>
        points.map(point => ({
          requestName,
          timestamp: point.timestamp,
          requests: point.requests,
          errors: point.errors,
          avgResponseTime: point.avgResponseTime
        }))
      );
    }
  }

// Chart data processing for aggregated view
const chartData = computed(() => {
  const data = timeSeriesData.value;
  if (data.length === 0) return null;

  // Prepare data for charts
  const labels = data.map(point => {
    const date = new Date(point.timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  });

  const requestsData = data.map(point => point.requests);
  const errorsData = data.map(point => point.errors);
  const responseTimeData = data.map(point => point.avgResponseTime);

  return {
    labels,
    requests: requestsData,
    errors: errorsData,
    responseTime: responseTimeData
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
  const labels = Object.keys(timeBuckets).sort((a, b) => parseInt(a) - parseInt(b)).map(timestamp => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  });

  return {
    labels,
    timeBuckets,
    requestNames
  };
});

// Chart options
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
      text: 'Requests vs Time' + (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0 ? ' (by Request Name)' : ''),
      font: {
        size: 16,
        weight: 'bold'
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      stacked: true,
      title: {
        display: true,
        text: 'Number of Requests'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Time'
      },
      grid: {
        display: false
      }
    }
  },
  animation: {
    duration: 500
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
      text: 'Errors vs Time' + (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0 ? ' (by Request Name)' : ''),
      font: {
        size: 16,
        weight: 'bold'
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      stacked: true,
      title: {
        display: true,
        text: 'Number of Errors'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Time'
      },
      grid: {
        display: false
      }
    }
  },
  animation: {
    duration: 500
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
    x: {
      title: {
        display: true,
        text: 'Time'
      },
      grid: {
        display: false
      }
    }
  },
  animation: {
    duration: 500
  },
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
  switch (percentile) {
    case 'mean':
      return point.avgResponseTime || 0;
    case 'p50':
      return point.p50ResponseTime || 0;
    case 'p75':
      return point.p75ResponseTime || 0;
    case 'p90':
      return point.p90ResponseTime || 0;
    case 'p95':
      return point.p95ResponseTime || 0;
    case 'p99':
      return point.p99ResponseTime || 0;
    default:
      return point.avgResponseTime || 0;
  }
}

  // Chart data objects
  const requestsChartData = computed(() => {
    // Show by-request view if available (for both live and historical data)
    if (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0) {
      const { labels, timeBuckets, requestNames } = chartDataByRequest.value;

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

        const data = labels.map((_, labelIndex) => {
          const timestamp = Object.keys(timeBuckets).sort((a, b) => parseInt(a) - parseInt(b))[labelIndex];
          const requestData = timeBuckets[parseInt(timestamp)]?.[requestName];
          return requestData?.requests || 0;
        });

    return {
      label: requestName,
      data,
      ...color,
      stack: 'requests',
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
    };
      });

      return {
        labels,
        datasets
      };
    } else if (chartData.value) {
      // Fallback to aggregated view for historical data
      return {
        labels: chartData.value.labels,
        datasets: [{
          label: 'Total Requests',
          data: chartData.value.requests,
          ...colorSchemes.requests,
          stack: 'requests',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }]
      };
    }

    return null;
  });

const errorsChartData = computed(() => {
  // For live data, show aggregated view
  if (!selectedRunId.value && chartData.value) {
    return {
      labels: chartData.value.labels,
      datasets: [{
        label: 'Errors (5xx)',
        data: chartData.value.errors,
        ...colorSchemes.errors,
        stack: 'errors',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  }

  // For historical data, show by-request view if available, otherwise aggregated view
  if (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0) {
    const { labels, timeBuckets, requestNames } = chartDataByRequest.value;

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

      const data = labels.map((_, labelIndex) => {
        const timestamp = Object.keys(timeBuckets).sort((a, b) => parseInt(a) - parseInt(b))[labelIndex];
        const requestData = timeBuckets[parseInt(timestamp)]?.[requestName];
        return requestData?.errors || 0;
      });

      // Only include datasets that have at least one error
      const hasErrors = data.some(val => val > 0);
      if (!hasErrors) return null;

      return {
        label: requestName,
        data,
        ...color,
        stack: 'errors',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      };
    }).filter(dataset => dataset !== null);

    if (datasets.length > 0) {
      return {
        labels,
        datasets
      };
    }
  }

  // Fallback to aggregated view for historical data or when no by-request errors
  if (chartData.value) {
    return {
      labels: chartData.value.labels,
      datasets: [{
        label: 'Errors (5xx)',
        data: chartData.value.errors,
        ...colorSchemes.errors,
        stack: 'errors',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  }

  return null;
});

const responseTimeChartData = computed(() => {
  // For live data, show aggregated view
  if (!selectedRunId.value && chartData.value) {
    return {
      labels: chartData.value.labels,
      datasets: [{
        label: `Response Time (${percentiles.find(p => p.value === selectedPercentile.value)?.label || 'Mean'})`,
        data: timeSeriesData.value.map(point => getResponseTimeValue(point, selectedPercentile.value)),
        ...colorSchemes.responseTime,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    };
  }

  // For historical data, show by-request view if available, otherwise aggregated view
  if (chartDataByRequest.value && chartDataByRequest.value.requestNames.length > 0) {
    const { labels, timeBuckets, requestNames } = chartDataByRequest.value;

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

      const data = labels.map((_, labelIndex) => {
        const timestamp = Object.keys(timeBuckets).sort((a, b) => parseInt(a) - parseInt(b))[labelIndex];
        const requestData = timeBuckets[parseInt(timestamp)]?.[requestName];
        return getResponseTimeValue(requestData, selectedPercentile.value);
      });

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
      labels,
      datasets
    };
  } else if (chartData.value) {
    // Fallback to aggregated view for historical data
    return {
      labels: chartData.value.labels,
      datasets: [{
        label: `Response Time (${percentiles.find(p => p.value === selectedPercentile.value)?.label || 'Mean'})`,
        data: timeSeriesData.value.map(point => getResponseTimeValue(point, selectedPercentile.value)),
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
      await loadTimeSeriesData();
    }
  }, { deep: true });

  // Watch for by-request rolling window changes
  watch(() => loadTestStore.rollingWindowByRequest, async () => {
    if (!selectedRunId.value) {
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
      // Refresh the completed runs list
      completedRuns.value = await loadTestStore.getCompletedRuns();
    } catch (error) {
      console.error('Failed to delete run:', error);
      alert('Failed to delete run');
    }
  }
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