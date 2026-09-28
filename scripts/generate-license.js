#!/usr/bin/env node
/**
 * Hailstorm License Key Generator
 * 
 * This script generates Ed25519 keypairs for licensing.
 * The public key should be embedded in the application (src/main/license.ts).
 * The private key should be kept secure and used to sign licenses for customers.
 */

import { generateKeyPairSync, sign, createPublicKey, createPrivateKey } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LICENSE_VERSION = '1.0.0';
const SUPPORTED_FEATURES = ['http', 'graphql', 'jsonrpc', 'websocket', 'grpc', 'shell', 'runner', 'loadtest', 'secrets', 'environments'];
const EMBEDDED_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAf271y+HSrRDIn+wtgiVlFSarLYFXUghwlPpnoKZHNKY=
-----END PUBLIC KEY-----`;

function generateKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
}

function createLicense(privateKeyPem, licensee, email, seatCount) {
  const privateKey = createPrivateKey({ key: privateKeyPem, format: 'pem', type: 'pkcs8' });

  const licenseData = {
    licensee,
    email,
    issuedAt: Date.now(),
    features: SUPPORTED_FEATURES,
    version: LICENSE_VERSION,
    seatCount,
  };

  const dataString = JSON.stringify(licenseData);
  const signature = sign(null, Buffer.from(dataString), privateKey).toString('base64');

  return {
    data: licenseData,
    signature,
    publicKey: EMBEDDED_PUBLIC_KEY,
  };
}

function printUsage() {
  console.log(`
Hailstorm License Key Generator
===============================

Usage:
  npm run generate-keys                      # Generate new keypair
  npm run generate-license <licensee> <email> [seatCount]  # Generate a license

Options:
  --help, -h    Show this help message

Examples:
  npm run generate-keys
  npm run generate-license "Acme Corp" "admin@acme.com" 10
  npm run generate-license "John Doe" "john@example.com" 5    # 5 seats

Output:
  - Keys are printed to stdout
  - Keys can be saved to files with --output flag
`);
}

function saveKeys(publicKey, privateKey, outputDir = '.') {
  writeFileSync(join(outputDir, 'hailstorm-public-key.pem'), publicKey);
  writeFileSync(join(outputDir, 'hailstorm-private-key.pem'), privateKey);
  console.log(`\nKeys saved to:`);
  console.log(`  ${join(outputDir, 'hailstorm-public-key.pem')}`);
  console.log(`  ${join(outputDir, 'hailstorm-private-key.pem')}`);
  console.log(`\nIMPORTANT: Keep the private key secure! Do not commit it to version control.`);
}

function generateLicense(licensee, email, seatCount, privateKeyPath) {
  let privateKey;
  
  if (privateKeyPath) {
    privateKey = require('node:fs').readFileSync(privateKeyPath, 'utf-8');
  } else {
    // Use the default private key from the app
    privateKey = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIAr9ncftH3jLzpIm2iwawsKQB4yjqSB0SpLuYrjEC98P
-----END PRIVATE KEY-----`;
  }
  
  const license = createLicense(privateKey, licensee, email, seatCount);
  
  console.log('\nGenerated License:');
  console.log(JSON.stringify(license, null, 2));
  
  return license;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  const command = args[0];
  
  if (!command || command === 'generate-keys') {
    console.log('Generating new Ed25519 keypair...\n');
    const { publicKey, privateKey } = generateKeyPair();
    
    console.log('PUBLIC KEY (embed this in src/main/license.ts):');
    console.log(publicKey);
    console.log('\nPRIVATE KEY (keep this secure!):');
    console.log(privateKey);
    
    if (args.includes('--output')) {
      const outputIndex = args.indexOf('--output');
      const outputDir = args[outputIndex + 1] || '.';
      saveKeys(publicKey, privateKey, outputDir);
    }
    
    console.log('\n---');
    console.log('To embed the public key in the application:');
    console.log('1. Copy the PUBLIC KEY above');
    console.log('2. Update EMBEDDED_PUBLIC_KEY in src/main/license.ts');
    console.log('3. Rebuild the application');
  } 
  else if (command === 'generate-license') {
    const licensee = args[1];
    const email = args[2];
    const days = args[3] ? parseInt(args[3], 10) : undefined;
    const privateKeyPath = args.includes('--key') ? args[args.indexOf('--key') + 1] : undefined;
    
    if (!licensee || !email) {
      console.error('Error: licensee and email are required');
      console.log('Usage: npm run generate-license <licensee> <email> [seatCount] [--key <private-key-path>]');
      process.exit(1);
    }
    
    console.log(`Generating license for: ${licensee} (${email})`);
    console.log(`Seat count: ${days}`);
    
    generateLicense(licensee, email, days, privateKeyPath);
  }
  else {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
}

main().catch(console.error);