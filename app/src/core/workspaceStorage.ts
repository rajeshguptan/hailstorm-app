import * as yaml from 'js-yaml';
import fs from 'fs';
import path from 'node:path';
import type { Collection, Request, Folder, RunConfig, Environment } from '../types';
import { sanitizeFilename } from './httpExecutor';
import { logger } from '../utils/logger';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface WorkspaceStructure {
  workspacePath: string;
}

export function getTimestampForFile(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${month}${day}${year}${hours}${minutes}`;
}

export function convertToYaml<T>(data: T): string {
  return yaml.dump(data, {
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false
  });
}

export function convertFromJson<T>(yamlContent: string): T {
  return yaml.load(yamlContent) as T;
}

export function saveCollectionToWorkspace(
  collection: Collection,
  workspacePath: string,
  environments: Environment[] = [],
  runConfigs: RunConfig[] = []
): { success: boolean; error?: string; } {
  try {
    logger.debug('[WORKSPACE] Saving collection to workspace:', workspacePath);

    const exists = fs.existsSync(workspacePath);
    if (!exists) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }

    const opencollectionPath = path.join(workspacePath, 'opencollection.yml');
    const collectionYaml = convertToYaml({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      variables: collection.variables,
      auth: collection.auth,
      preRequestScript: collection.preRequestScript,
      postRequestScript: collection.postRequestScript,
      testScript: collection.testScript,
      savedAt: new Date().toISOString()
    });
    fs.writeFileSync(opencollectionPath, collectionYaml, 'utf-8');

    const environmentsPath = path.join(workspacePath, 'environments.yml');
    const environmentsYaml = convertToYaml(environments.map(env => ({
      id: env.id,
      name: env.name,
      active: env.active,
      variables: env.variables
    })));
    fs.writeFileSync(environmentsPath, environmentsYaml, 'utf-8');

    const runnerDir = path.join(workspacePath, 'collectionRunner', 'runConfig');
    fs.mkdirSync(runnerDir, { recursive: true });

    const runConfigsPath = path.join(runnerDir, 'config.yml');
    const runConfigsYaml = convertToYaml(runConfigs);
    fs.writeFileSync(runConfigsPath, runConfigsYaml, 'utf-8');

    const privateDir = path.join(workspacePath, 'requests', 'private');
    const sharedDir = path.join(workspacePath, 'requests', 'shared');

    saveItemsToWorkspace(collection.items, privateDir, sharedDir);

    logger.debug('[WORKSPACE] Collection saved successfully');
    return { success: true };
  } catch (err: any) {
    logger.error('[WORKSPACE] Failed to save collection:', err.message);
    return { success: false, error: err.message };
  }
}

export function saveItemsToWorkspace(
  items: (Request | Folder)[],
  privateDir: string,
  sharedDir: string
): void {
  const saveItemsRecursive = (
    items: (Request | Folder)[],
    currentPrivate: string,
    currentShared: string
  ) => {
    for (const item of items) {
      if ('method' in item) {
        const isPrivate = item.isPrivate === true;
        const targetDir = isPrivate ? currentPrivate : currentShared;
        const filename = `${sanitizeFilename(item.name)}.yml`;
        const filePath = path.join(targetDir, filename);

        const requestData: Record<string, unknown> = {
          id: item.id,
          name: item.name,
          method: item.method,
          url: item.url,
          headers: item.headers,
          body: item.body,
          description: item.description,
          isPrivate: item.isPrivate,
          isWebSocket: item.isWebSocket,
          isJsonRpc: item.isJsonRpc,
          isGrpc: item.isGrpc,
          variables: item.variables
        };

        if (item.auth) requestData.auth = item.auth;
        if (item.preRequestScript) requestData.preRequestScript = item.preRequestScript;
        if (item.postRequestScript) requestData.postRequestScript = item.postRequestScript;
        if (item.testScript) requestData.testScript = item.testScript;

        const yamlContent = convertToYaml(requestData);
        fs.writeFileSync(filePath, yamlContent, 'utf-8');
      } else {
        const folderName = sanitizeFilename(item.name);
        const privateFolderPath = path.join(currentPrivate, folderName);
        const sharedFolderPath = path.join(currentShared, folderName);

        fs.mkdirSync(privateFolderPath, { recursive: true });
        fs.mkdirSync(sharedFolderPath, { recursive: true });

        const folderYaml = convertToYaml({
          id: item.id,
          name: item.name
        });
        fs.writeFileSync(path.join(privateFolderPath, `${folderName}.yml`), folderYaml, 'utf-8');
        fs.writeFileSync(path.join(sharedFolderPath, `${folderName}.yml`), folderYaml, 'utf-8');

        if (item.items) {
          saveItemsRecursive(item.items, privateFolderPath, sharedFolderPath);
        }
      }
    }
  };

  saveItemsRecursive(items, privateDir, sharedDir);
}

export function loadCollectionFromWorkspace(
  workspacePath: string
): { collection?: Collection; environments?: Environment[]; runConfigs?: RunConfig[]; error?: string } {
  try {
    logger.debug('[WORKSPACE] Loading collection from workspace:', workspacePath);

    const opencollectionPath = path.join(workspacePath, 'opencollection.yml');
    if (!fs.existsSync(opencollectionPath)) {
      return { error: 'opencollection.yml not found in workspace' };
    }

    const collectionYaml = fs.readFileSync(opencollectionPath, 'utf-8');
    const collectionData = convertFromJson<Partial<Collection>>(collectionYaml);

    const environmentsPath = path.join(workspacePath, 'environments.yml');
    let environments: Environment[] = [];
    if (fs.existsSync(environmentsPath)) {
      const environmentsYaml = fs.readFileSync(environmentsPath, 'utf-8');
      environments = convertFromJson<Environment[]>(environmentsYaml);
    }

    const runConfigsPath = path.join(workspacePath, 'collectionRunner', 'runConfig', 'config.yml');
    let runConfigs: RunConfig[] = [];
    if (fs.existsSync(runConfigsPath)) {
      const runConfigsYaml = fs.readFileSync(runConfigsPath, 'utf-8');
      runConfigs = convertFromJson<RunConfig[]>(runConfigsYaml);
    }

    const privateDir = path.join(workspacePath, 'requests', 'private');
    const items = loadItemsFromWorkspace(privateDir, workspacePath);

    const collection: Collection = {
      id: collectionData.id || generateId('coll'),
      name: collectionData.name || 'Loaded Collection',
      items: items,
      variables: collectionData.variables || [],
      description: collectionData.description,
      workspaceLocation: workspacePath,
      preRequestScript: collectionData.preRequestScript,
      postRequestScript: collectionData.postRequestScript,
      testScript: collectionData.testScript,
      auth: collectionData.auth
    };

    return { collection, environments, runConfigs };
  } catch (err: any) {
    logger.error('[WORKSPACE] Failed to load collection:', err.message);
    return { error: err.message };
  }
}

export function loadItemsFromWorkspace(
  privateDir: string,
  workspacePath: string,
  sharedDir?: string
): (Request | Folder)[] {
  const items: (Request | Folder)[] = [];

  if (!fs.existsSync(privateDir)) {
    return items;
  }

  const loadItemsRecursive = (currentPrivate: string, currentShared?: string): (Request | Folder)[] => {
    const result: (Request | Folder)[] = [];

    const privateEntries = fs.readdirSync(currentPrivate, { withFileTypes: true });

    for (const entry of privateEntries) {
      if (entry.isDirectory()) {
        const folderName = entry.name.replace('.yml', '');
        const folderPath = path.join(currentPrivate, entry.name);
        const itemsPath = path.join(folderPath, entry.name);

        const items = entry.name.endsWith('.yml')
          ? loadItemsRecursive(path.join(currentPrivate, folderName), currentShared ? path.join(currentShared, folderName) : undefined)
          : loadItemsRecursive(entry.name, currentShared ? path.join(currentShared, folderName) : undefined);

        const folderYamlPath = path.join(currentPrivate, `${folderName}.yml`);
        let folderData = { id: generateId('fol'), name: folderName };
        if (fs.existsSync(folderYamlPath)) {
          const yaml = fs.readFileSync(folderYamlPath, 'utf-8');
          folderData = convertFromJson<{ id: string; name: string }>(yaml) || folderData;
        }

        result.push({
          id: folderData.id,
          name: folderData.name,
          items: items
        });
      } else if (entry.name.endsWith('.yml')) {
        const yamlContent = fs.readFileSync(path.join(currentPrivate, entry.name), 'utf-8');
        const requestData = convertFromJson<Record<string, unknown>>(yamlContent);

        result.push({
          id: requestData.id as string || generateId('req'),
          name: requestData.name as string || entry.name.replace('.yml', ''),
          method: requestData.method as string,
          url: requestData.url as string || '',
          headers: requestData.headers as { key: string; value: string; enabled?: boolean }[] || [],
          body: requestData.body as { type: string; content: string } || { type: 'none', content: '' },
          description: requestData.description as string,
          isPrivate: requestData.isPrivate as boolean,
          isWebSocket: requestData.isWebSocket as boolean,
          isJsonRpc: requestData.isJsonRpc as boolean,
          isGrpc: requestData.isGrpc as boolean,
          variables: requestData.variables as { key: string; value: string; enabled?: boolean }[],
          auth: requestData.auth
        } as Request);
      }
    }

    return result;
  };

  return loadItemsRecursive(privateDir);
}

export function saveRunStatsToWorkspace(
  workspacePath: string,
  runStats: { runId: string; stats: Record<string, unknown> }
): { success: boolean; error?: string } {
  try {
    const runStatsDir = path.join(workspacePath, 'collectionRunner', 'runStats');
    fs.mkdirSync(runStatsDir, { recursive: true });

    const timestamp = getTimestampForFile();
    const summaryPath = path.join(runStatsDir, `summary_${timestamp}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(runStats.stats, null, 2), 'utf-8');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}