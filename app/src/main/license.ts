import { createSign, createVerify, generateKeyPairSync, createPublicKey, createPrivateKey, sign, verify } from 'node:crypto';
import { LicenseData, SignedLicense, LicenseValidationResult } from '../types';

const LICENSE_VERSION = '1.0.0';
const SUPPORTED_FEATURES = ['http', 'graphql', 'jsonrpc', 'websocket', 'grpc', 'shell', 'runner', 'loadtest', 'secrets', 'environments'];

// Embedded public key for license verification (replace with your own generated key)
const EMBEDDED_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAf271y+HSrRDIn+wtgiVlFSarLYFXUghwlPpnoKZHNKY=
-----END PUBLIC KEY-----`;

// Revoked licenses list - in production, this could be fetched from a remote URL
// Format: { "licenseId": "revocationReason" }
let revokedLicenses: Record<string, string> = {};

export function setRevokedLicenses(list: Record<string, string>) {
  revokedLicenses = list;
}

export function getRevokedLicenses(): Record<string, string> {
  return { ...revokedLicenses };
}

export function isLicenseRevoked(licenseId: string): boolean {
  return licenseId in revokedLicenses;
}

export function revokeLicense(licenseId: string, reason: string = 'Revoked by vendor'): void {
  revokedLicenses[licenseId] = reason;
}

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
}

export function createLicense(
  privateKeyPem: string,
  licensee: string,
  email: string,
  seatCount: number
): SignedLicense {
  const privateKey = createPrivateKey({ key: privateKeyPem, format: 'pem', type: 'pkcs8' });

  const licenseData: LicenseData = {
    licensee,
    email,
    issuedAt: Date.now(),
    features: SUPPORTED_FEATURES,
    version: LICENSE_VERSION,
    seatCount,
  };

  const dataString = JSON.stringify(licenseData);
  // Use one-shot sign with null algorithm for Ed25519
  const signature = sign(null, Buffer.from(dataString), privateKey).toString('base64');

  return {
    data: licenseData,
    signature,
    publicKey: EMBEDDED_PUBLIC_KEY,
  };
}

export function validateLicense(
  licenseKey: string,
  embeddedPublicKeyPem: string = EMBEDDED_PUBLIC_KEY
): LicenseValidationResult {
  try {
    const license = JSON.parse(licenseKey) as SignedLicense;

    if (!license.data || !license.signature || !license.publicKey) {
      return { valid: false, error: 'Invalid license format' };
    }

    if (license.publicKey !== embeddedPublicKeyPem) {
      return { valid: false, error: 'License public key does not match embedded public key' };
    }

    const { data, signature } = license;
    const dataString = JSON.stringify(data);

    // Check revocation
    const licenseId = `${data.licensee}:${data.email}:${data.issuedAt}`;
    if (isLicenseRevoked(licenseId)) {
      return { valid: false, error: `License revoked: ${revokedLicenses[licenseId]}`, licensee: data.licensee, email: data.email };
    }

    const publicKey = createPublicKey({ key: license.publicKey, format: 'pem', type: 'spki' });
    // Use one-shot verify with null algorithm for Ed25519
    const isValid = verify(null, Buffer.from(dataString), publicKey, Buffer.from(signature, 'base64'));

    if (!isValid) {
      return { valid: false, error: 'Invalid license signature' };
    }

    if (data.expiresAt && data.expiresAt < Date.now()) {
      return { valid: false, error: 'License has expired', licensee: data.licensee, email: data.email };
    }

    return {
      valid: true,
      licensee: data.licensee,
      email: data.email,
      features: data.features,
      seatCount: data.seatCount,
    };
  } catch (error) {
    return { valid: false, error: `License validation failed: ${(error as Error).message}` };
  }
}

export function getEmbeddedPublicKey(): string {
  return EMBEDDED_PUBLIC_KEY;
}