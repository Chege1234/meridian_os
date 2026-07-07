/**
 * Infrastructure — Credential Encryption
 *
 * AES-256-GCM authenticated encryption for AI provider API keys.
 * Keys are encrypted before being stored in the database, and decrypted
 * server-side only at the moment of an outbound AI call.
 *
 * Security guarantees:
 *   - The decrypted key is NEVER logged, returned in API responses,
 *     or passed to client-side code under any circumstance.
 *   - The master secret lives only in the CREDENTIAL_ENCRYPTION_KEY env var.
 *   - AES-256-GCM provides both confidentiality and integrity (tamper detection).
 *
 * Ciphertext format (single text column):
 *   "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * Per docs/09_SECURITY_SPECIFICATION.md:
 *   Sensitive tokens encrypted at rest. Never store secrets in source code.
 */

// This module must only run server-side. Never import from client components.
import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;   // 96-bit IV — recommended for GCM
const TAG_BYTES = 16;  // 128-bit auth tag — GCM default

/**
 * Derives the 32-byte master key from the environment variable.
 * Throws at startup if the key is absent or malformed — fail fast.
 */
function getMasterKey(): Buffer {
  const hex = process.env.CREDENTIAL_ENCRYPTION_KEY;

  if (!hex) {
    throw new Error(
      '[CredentialEncryption] CREDENTIAL_ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: openssl rand -hex 32',
    );
  }

  if (hex.length !== 64) {
    throw new Error(
      '[CredentialEncryption] CREDENTIAL_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). ' +
      `Got ${hex.length} characters.`,
    );
  }

  return Buffer.from(hex, 'hex');
}

/**
 * Encrypts a plaintext API key using AES-256-GCM.
 *
 * @param plaintext - The raw API key string to encrypt.
 * @returns A colon-separated string: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
export function encryptCredentialKey(plaintext: string): string {
  const masterKey = getMasterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a stored credential ciphertext back to the plaintext API key.
 * Verifies the GCM authentication tag — throws if tampered.
 *
 * @param stored - The stored string in format "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 * @returns The original plaintext API key.
 */
export function decryptCredentialKey(stored: string): string {
  const parts = stored.split(':');

  if (parts.length !== 3) {
    throw new Error(
      '[CredentialEncryption] Invalid ciphertext format. ' +
      'Expected "<iv_hex>:<authTag_hex>:<ciphertext_hex>".',
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts as [string, string, string];
  const masterKey = getMasterKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(), // throws if auth tag verification fails
  ]);

  return decrypted.toString('utf8');
}
