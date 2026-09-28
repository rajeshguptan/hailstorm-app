import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LicenseValidationResult } from '../types';

export const useLicenseStore = defineStore('license', () => {
  const licenseKey = ref<string | null>(null);
  const validationResult = ref<LicenseValidationResult | null>(null);
  const isValidating = ref(false);

  const isLicensed = computed(() => validationResult.value?.valid === true);
  const licensee = computed(() => validationResult.value?.licensee || null);
  const email = computed(() => validationResult.value?.email || null);
  const expiresAt = computed(() => validationResult.value?.expiresAt || null);
  const features = computed(() => validationResult.value?.features || []);
  const error = computed(() => validationResult.value?.error || null);

  const isExpired = computed(() => {
    if (!expiresAt.value) return false;
    return expiresAt.value < Date.now();
  });

  const daysUntilExpiry = computed(() => {
    if (!expiresAt.value) return null;
    const diff = expiresAt.value - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  async function validate(license: string): Promise<LicenseValidationResult> {
    isValidating.value = true;
    try {
      const result = await window.api.validateLicense(license);
      validationResult.value = result;
      if (result.valid) {
        licenseKey.value = license;
        localStorage.setItem('hailstorm_license', license);
        await window.api.setLicensee(result.licensee || null);
      } else {
        await window.api.setLicensee(null);
      }
      return result;
    } finally {
      isValidating.value = false;
    }
  }

  async function loadSavedLicense(): Promise<LicenseValidationResult | null> {
    const saved = localStorage.getItem('hailstorm_license');
    if (saved) {
      const result = await validate(saved);
      if (result.valid) {
        await window.api.setLicensee(result.licensee || null);
      }
      return result;
    }
    await window.api.setLicensee(null);
    return null;
  }

  async function clearLicense() {
    licenseKey.value = null;
    validationResult.value = null;
    localStorage.removeItem('hailstorm_license');
    await window.api.setLicensee(null);
  }

  async function getEmbeddedPublicKeyForDisplay(): Promise<string> {
    return await window.api.getEmbeddedPublicKey();
  }

  return {
    licenseKey,
    validationResult,
    isValidating,
    isLicensed,
    licensee,
    email,
    expiresAt,
    features,
    error,
    isExpired,
    daysUntilExpiry,
    validate,
    loadSavedLicense,
    clearLicense,
    getEmbeddedPublicKeyForDisplay,
  };
});