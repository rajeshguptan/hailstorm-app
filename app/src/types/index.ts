export interface Variable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestVariable extends Variable {
  dataset?: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: Variable[];
  active: boolean;
}

export interface Auth {
  type: 'noauth' | 'bearer' | 'basic' | 'digest' | 'oauth1' | 'oauth2' | 'apikey';
  bearerToken?: string;
  username?: string;
  password?: string;
  apikey?: { key: string; value: string; in: 'header' | 'query' };
}

export interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Variable[];
  body: { type: string; content: string };
  auth?: Auth;
  preRequestScript?: string;
  testScript?: string;
  flavors?: Request[];
  variables?: RequestVariable[];
  response?: Response;
  dependsOn?: string; // ID of another request in the same collection
}

export interface Folder {
  id: string;
  name: string;
  items: (Request | Folder)[];
}

export interface Collection {
  id: string;
  name: string;
  items: (Request | Folder)[];
  variables: Variable[];
  description?: string;
  workspaceLocation?: string;
  preRequestScript?: string;
  testScript?: string;
  auth?: Auth;
}

export interface HistoryItem {
  id: number;
  method: string;
  url: string;
  status: number;
  time: number; // Response time in ms
  timestamp: number; // Execution timestamp
  request: Request;
  response: Response;
}

export interface Tab {
  id: string;
  request: Request;
}

export interface Response {
  status: number;
  statusText: string;
  data: string;
  time: number;
  headers: Record<string, string | string[]>;
}

export interface Secret {
  id: string;
  name: string;
  env: string;
  value: string;
}

export interface ConsoleLog {
  time: string;
  message: string;
  type: string;
}

export interface TestStats {
  total: number;
  passed: number;
  failed: number;
  avgTime: number;
}

// Load Testing Data Model
export interface LoadTestRun {
  id: string;
  name: string;
  collectionId: string;
  collectionName: string;
  selectedRequests: string[];
  runMode: 'parallel' | 'sequential';
  delay: number;
  runRepeated: boolean;
  iterations: number;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'stopped';
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
}

export interface LoadTestRunMetrics {
  runId: string;
  timeBucket: number; // timestamp rounded to bucket size
  bucketSize: number; // in seconds (e.g., 1, 5, 60)
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface LoadTestRequestIndex {
  id: string;
  runId: string;
  requestId: string;
  requestName: string;
  method: string;
  url: string;
  urlHash: string;
  status: number;
  latency: number;
  responseSize: number;
  error: boolean;
  timestamp: number;
  detailChunkId: string;
  sequenceNumber: number;
}

export interface LoadTestDetailChunk {
  id: string;
  runId: string;
  filePath: string;
  startSequence: number;
  endSequence: number;
  recordCount: number;
  compressedSize: number;
  createdAt: number;
}

export interface LoadTestRequestDetail {
  requestIndexId: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: string;
    size: number;
  };
  timestamp: number;
  latency: number;
  error?: string;
}

export interface LoadTestStats {
  runId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface LoadTestTimeSeriesPoint {
  timestamp: number;
  requests: number;
  errors: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p75ResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface LoadTestTimeSeriesByRequestPoint {
  requestName: string;
  timestamp: number;
  requests: number;
  errors: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p75ResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface RequestConfig {
  id: string;
  rps: number;
  datafile: string;
}

export interface RunConfig {
  id: string;
  name: string;
  collectionId: string;
  collectionName: string;
  selectedRequests: string[];
  runRepeated: boolean;
  duration: number;
  requestConfigs?: Record<string, RequestConfig>;
}

export interface SettingsCategory {
  id: string;
  name: string;
  icon: string;
  settings: Setting[];
}

export interface Setting {
  id: string;
  name: string;
  description?: string;
  subSettings?: SubSetting[];
}

export interface SubSetting {
  id: string;
  name: string;
  icon: string;
  // Additional properties for different setting types can be added here
}

export type SidebarView = 'collections' | 'environments' | 'history' | 'secrets' | 'stats' | 'utilities' | 'settings' | 'runner';

export interface Utility {
  id: string;
  name: string;
  icon: string;
  command?: string;
  postProcessScript?: string;
}

export type RequestTab = 'params' | 'auth' | 'headers' | 'body' | 'variables' | 'scripts';
export type ResponseTab = 'body' | 'headers' | 'tests';
