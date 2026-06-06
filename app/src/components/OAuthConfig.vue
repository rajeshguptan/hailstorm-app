<template>
  <div class="space-y-4">
    <div class="border border-zinc-300 dark:border-zinc-600 rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-zinc-700 dark:text-zinc-300">OAuth 2.0 Authorization Code Flow</h4>
        <button
          v-if="oauth2.accessToken"
          @click="clearToken"
          class="text-xs text-red-500 hover:text-red-600"
        >
          Clear Token
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label class="block text-xs text-zinc-500 mb-1">Authorization URL</label>
          <input
            v-model="oauth2.authorizationUrl"
            type="text"
            class="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            placeholder="https://auth.example.com/oauth/authorize"
          />
        </div>
        <div>
          <label class="block text-xs text-zinc-500 mb-1">Token URL</label>
          <input
            v-model="oauth2.tokenUrl"
            type="text"
            class="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            placeholder="https://auth.example.com/oauth/token"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label class="block text-xs text-zinc-500 mb-1">Client ID</label>
          <input
            v-model="oauth2.clientId"
            type="text"
            class="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            placeholder="Client ID"
          />
        </div>
        <div>
          <label class="block text-xs text-zinc-500 mb-1">Client Secret</label>
          <input
            v-model="oauth2.clientSecret"
            type="password"
            class="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            placeholder="Client Secret"
          />
        </div>
      </div>

      <div class="mb-3">
        <label class="block text-xs text-zinc-500 mb-1">Redirect URI</label>
        <input
          v-model="redirectUri"
          type="text"
          disabled
          class="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed"
        />
        <p class="text-xs text-zinc-500 mt-1">Use this URI in your OAuth provider configuration</p>
      </div>

      <div class="mb-3">
        <label class="block text-xs text-zinc-500 mb-1">Scope (space-separated)</label>
        <input
          v-model="oauth2.scope"
          type="text"
          class="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white"
          placeholder="openid profile email"
        />
      </div>

      <div v-if="tokenExpiry" class="mb-3 p-2 bg-zinc-100 dark:bg-zinc-700 rounded">
        <p class="text-xs text-zinc-600 dark:text-zinc-400">
          Token expires: {{ formatExpiry(tokenExpiry) }}
        </p>
      </div>

      <button
        @click="startOAuthFlow"
        :disabled="!canStartFlow"
        class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-md text-sm"
      >
        {{ oauth2.accessToken ? 'Refresh Token' : 'Authorize with OAuth' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Auth } from '../types';

const props = defineProps<{
  auth: Auth;
}>();

const redirectUri = ref('hailstorm://oauth/callback');
const tokenExpiry = ref<number | null>(null);

// Ensure oauth2 is initialized - use a getter that initializes on first access
const oauth2 = computed({
  get() {
    if (!props.auth.oauth2) {
      props.auth.oauth2 = { grantType: 'client_credentials' };
    }
    return props.auth.oauth2;
  },
  set(value) {
    props.auth.oauth2 = value;
  }
});

const canStartFlow = computed(() => {
  return oauth2.value.authorizationUrl && 
         oauth2.value.tokenUrl && 
         oauth2.value.clientId;
});

function formatExpiry(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function clearToken() {
  oauth2.value.accessToken = '';
  oauth2.value.refreshToken = '';
  tokenExpiry.value = null;
}

async function handleOAuthCallback(data: { code: string; state: string; error?: string }) {
  if (data.error) {
    console.error('[OAuthConfig] OAuth error:', data.error);
    return;
  }

  try {
    const result = await window.api.exchangeOAuthCode(data.code, {
      tokenUrl: oauth2.value.tokenUrl!,
      clientId: oauth2.value.clientId!,
      clientSecret: oauth2.value.clientSecret,
      redirectUri: redirectUri.value,
      state: data.state
    });

    oauth2.value.accessToken = result.accessToken;
    if (result.refreshToken) {
      oauth2.value.refreshToken = result.refreshToken;
    }
    if (result.expiresIn) {
      tokenExpiry.value = Date.now() + (result.expiresIn * 1000);
    }
  } catch (error) {
    console.error('[OAuthConfig] Token exchange failed:', error);
  }
}

function startOAuthFlow() {
  if (!canStartFlow.value) return;

  // Listen for OAuth callback
  window.api.onOAuthCallback(handleOAuthCallback);

  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const authUrl = new URL(oauth2.value.authorizationUrl!);
  authUrl.searchParams.set('client_id', oauth2.value.clientId!);
  authUrl.searchParams.set('redirect_uri', redirectUri.value);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', oauth2.value.scope || 'openid');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  // Store state and code verifier in main process via IPC
  window.api.storeOAuthState({ state, codeVerifier });

  // Open system browser
  window.api.openExternal(authUrl.toString());
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateCodeChallenge(verifier: string): string {
  // Simple base64url encoding for demo (in production, use Web Crypto API)
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const buffer = btoa(String.fromCharCode.apply(null, Array.from(data)));
  return buffer.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
</script>