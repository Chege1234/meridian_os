import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { encryptCredentialKey, decryptCredentialKey } from '@/infrastructure/ai/credentialEncryption';

describe('CredentialEncryption', () => {
  const ORIGINAL_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY;
  const TEST_MASTER_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeAll(() => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = TEST_MASTER_KEY;
  });

  afterAll(() => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = ORIGINAL_KEY;
  });

  it('should encrypt and decrypt a plaintext string successfully', () => {
    const rawKey = 'sk-projTestKey1234567890abcdefghijklmnopqrstuvwxyz';
    const encrypted = encryptCredentialKey(rawKey);

    expect(encrypted).toContain(':');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3); // iv, authTag, ciphertext

    const decrypted = decryptCredentialKey(encrypted);
    expect(decrypted).toBe(rawKey);
  });

  it('should produce different ciphertexts for the same plaintext due to random IVs', () => {
    const rawKey = 'sk-projTestKey1234567890abcdefghijklmnopqrstuvwxyz';
    const encrypted1 = encryptCredentialKey(rawKey);
    const encrypted2 = encryptCredentialKey(rawKey);

    expect(encrypted1).not.toBe(encrypted2);
    expect(decryptCredentialKey(encrypted1)).toBe(rawKey);
    expect(decryptCredentialKey(encrypted2)).toBe(rawKey);
  });

  it('should throw an error on decrypt if the ciphertext is malformed', () => {
    expect(() => decryptCredentialKey('invalid-format')).toThrow('Invalid ciphertext format');
  });

  it('should throw an error on decrypt if the auth tag verification fails (tampering simulated)', () => {
    const rawKey = 'sk-projTestKey1234567890abcdefghijklmnopqrstuvwxyz';
    const encrypted = encryptCredentialKey(rawKey);
    const parts = encrypted.split(':');

    // Tamper with the ciphertext (flip a char in the last hex block)
    const tamperedCipher = parts[2]!.substring(0, parts[2]!.length - 1) + (parts[2]!.endsWith('0') ? '1' : '0');
    const tampered = `${parts[0]}:${parts[1]}:${tamperedCipher}`;

    // AES-GCM decryption must fail authenticity check and throw
    expect(() => decryptCredentialKey(tampered)).toThrow();
  });

  it('should throw an error if the master key is missing or invalid size', () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = '';
    expect(() => encryptCredentialKey('sk-key')).toThrow('not set');

    process.env.CREDENTIAL_ENCRYPTION_KEY = 'too-short';
    expect(() => encryptCredentialKey('sk-key')).toThrow('must be exactly 64 hex characters');
  });
});
