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

export interface RunConfig {
  id: string;
  name: string;
  collectionId: string;
  collectionName: string;
  selectedRequests: string[];
  runMode: 'parallel' | 'sequential';
  delay: number;
  runRepeated: boolean;
  iterations: number;
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
