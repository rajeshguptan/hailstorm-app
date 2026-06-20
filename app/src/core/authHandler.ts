import type { Auth, VariableData } from '../types';

interface AuthSubstitutionContext {
  headers: Record<string, string>;
  url: string;
}

export function substituteAll(
  text: string,
  envVars: VariableData[],
  reqVars: VariableData[],
  secrets?: { name: string; value: string }[],
  collectionVars?: VariableData[],
): string {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}/g, (_match, varName: string) =>
    substituteVariable(_match, varName, envVars, reqVars, secrets, collectionVars),
  );
}

export function substituteVariable(
  match: string,
  varName: string,
  envVars: VariableData[],
  reqVars: VariableData[],
  secrets?: { name: string; value: string }[],
  collectionVars?: VariableData[],
): string {
  const envVar = envVars.find((v) => v.key === varName && v.enabled !== false);
  if (envVar) return envVar.value;

  const collectionVar = collectionVars?.find((v) => v.key === varName && v.enabled !== false);
  if (collectionVar) return collectionVar.value;

  const reqVar = reqVars.find((v) => v.key === varName && v.enabled !== false);
  if (reqVar) return reqVar.value;

  if (secrets) {
    const secret = secrets.find((s) => s.name === varName);
    if (secret && secret.value) return secret.value;
  }

  return match;
}

export function setContentType(
  headers: Record<string, string>,
  bodyType: string,
  hasBody: boolean,
): void {
  if (!hasBody) return;
  if (bodyType === 'json') headers['Content-Type'] = 'application/json';
  else if (bodyType === 'x-www-form-urlencoded') headers['Content-Type'] = 'application/x-www-form-urlencoded';
  else if (bodyType === 'form-data') headers['Content-Type'] = 'multipart/form-data';
  else if (bodyType === 'graphql') headers['Content-Type'] = 'application/json';
}

export function applyAuthAndHeaders(
  opts: AuthSubstitutionContext,
  auth: Auth | undefined,
  seVars: VariableData[],
  reqVars: VariableData[],
  secrets?: { name: string; value: string }[],
  collectionVars?: VariableData[],
): void {
  if (!auth) return;

  if (auth.type === 'bearer' && auth.bearerToken) {
    opts.headers['Authorization'] = `Bearer ${substituteAll(auth.bearerToken, seVars, reqVars, secrets, collectionVars)}`;
  } else if (auth.type === 'basic' && auth.username && auth.password) {
    const u = substituteAll(auth.username, seVars, reqVars, secrets, collectionVars);
    const p = substituteAll(auth.password, seVars, reqVars, secrets, collectionVars);
    opts.headers['Authorization'] = `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;
  } else if (auth.type === 'ntlm' && auth.ntlm) {
    const domain = substituteAll(auth.ntlm.domain || '', seVars, reqVars, secrets, collectionVars);
    const username = substituteAll(auth.ntlm.username || '', seVars, reqVars, secrets, collectionVars);
    const password = substituteAll(auth.ntlm.password || '', seVars, reqVars, secrets, collectionVars);
    const credentials = domain ? `${domain}\\${username}` : username;
    opts.headers['Authorization'] = `NTLM ${credentials}:${password}`;
  } else if (auth.type === 'oauth2' && auth.oauth2) {
    if (auth.oauth2.accessToken) {
      opts.headers['Authorization'] = `Bearer ${auth.oauth2.accessToken}`;
    }
  } else if (auth.type === 'apikey' && auth.apikey) {
    const k = substituteAll(auth.apikey.key, seVars, reqVars, secrets, collectionVars);
    const v = substituteAll(auth.apikey.value, seVars, reqVars, secrets, collectionVars);
    if (auth.apikey.in === 'header') {
      opts.headers[k] = v;
    } else {
      const urlObj = new URL(opts.url);
      urlObj.searchParams.set(k, v);
      opts.url = urlObj.toString();
    }
  }
}