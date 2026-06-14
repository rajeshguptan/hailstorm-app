import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import fs from 'fs';
import type { Auth } from '../types';

export class TokenBucket {
  capacity: number;
  tokens: number;
  rps: number;
  lastRefill: number;

  constructor(rps: number) {
    this.capacity = rps;
    this.tokens = rps;
    this.rps = rps;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.rps;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  consume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  async consumeWait(): Promise<void> {
    return new Promise((resolve) => {
      const tryConsume = () => {
        this.refill();
        if (this.tokens >= 1) {
          this.tokens -= 1;
          resolve();
        } else {
          setTimeout(tryConsume, 10);
        }
      };
      tryConsume();
    });
  }

  setRps(newRps: number) {
    this.rps = newRps;
    this.capacity = newRps;
    this.tokens = Math.min(this.tokens, this.capacity);
  }
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function flatRequests(items: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const item of items) {
    if (item && item.method && item.url) {
      map.set(item.id, item);
    }
    if (item && item.items && Array.isArray(item.items)) {
      flatRequests(item.items).forEach((v, k) => map.set(k, v));
    }
  }
  return map;
}