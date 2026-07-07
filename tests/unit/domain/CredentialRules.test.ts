import { describe, it, expect } from 'vitest';
import {
  canManageCredentials,
  isValidProvider,
  isValidModelTier,
  validateKeyFormat,
  validatePriority,
  getDefaultModel,
} from '@/domain/rules/CredentialRules';

describe('CredentialRules — canManageCredentials', () => {
  it('should allow owners and admins', () => {
    expect(canManageCredentials('owner')).toBe(true);
    expect(canManageCredentials('admin')).toBe(true);
    expect(canManageCredentials('OWNER')).toBe(true);
  });

  it('should reject editors, viewers, or other roles', () => {
    expect(canManageCredentials('editor')).toBe(false);
    expect(canManageCredentials('viewer')).toBe(false);
    expect(canManageCredentials('guest')).toBe(false);
  });
});

describe('CredentialRules — isValidProvider', () => {
  it('should validate correct providers', () => {
    expect(isValidProvider('openai')).toBe(true);
    expect(isValidProvider('anthropic')).toBe(true);
    expect(isValidProvider('google')).toBe(true);
  });

  it('should reject invalid providers', () => {
    expect(isValidProvider('cohere')).toBe(false);
    expect(isValidProvider('meta')).toBe(false);
  });
});

describe('CredentialRules — isValidModelTier', () => {
  it('should validate correct tiers', () => {
    expect(isValidModelTier('flagship')).toBe(true);
    expect(isValidModelTier('fast')).toBe(true);
  });

  it('should reject invalid tiers', () => {
    expect(isValidModelTier('premium')).toBe(false);
    expect(isValidModelTier('slow')).toBe(false);
  });
});

describe('CredentialRules — validateKeyFormat', () => {
  it('should reject empty keys', () => {
    expect(validateKeyFormat('openai', '')).toBe('API key cannot be empty.');
    expect(validateKeyFormat('openai', '   ')).toBe('API key cannot be empty.');
  });

  it('should validate OpenAI keys starting with sk-', () => {
    expect(validateKeyFormat('openai', 'sk-proj12345678901234567890')).toBeNull();
    expect(validateKeyFormat('openai', 'key-12345')).toContain('start with "sk-"');
  });

  it('should validate Anthropic keys starting with sk-ant-', () => {
    expect(validateKeyFormat('anthropic', 'sk-ant-sid12345678901234567890')).toBeNull();
    expect(validateKeyFormat('anthropic', 'sk-12345')).toContain('start with "sk-ant-"');
  });

  it('should validate Google keys starting with AIza', () => {
    expect(validateKeyFormat('google', 'AIzaSy12345678901234567890')).toBeNull();
    expect(validateKeyFormat('google', 'key-12345')).toContain('start with "AIza"');
  });
});

describe('CredentialRules — validatePriority', () => {
  it('should accept valid positive integers', () => {
    expect(validatePriority(1)).toBeNull();
    expect(validatePriority(10)).toBeNull();
    expect(validatePriority(9999)).toBeNull();
  });

  it('should reject non-integers, negative numbers, or extremely large values', () => {
    expect(validatePriority(0)).toContain('positive integer');
    expect(validatePriority(-5)).toContain('positive integer');
    expect(validatePriority(1.5)).toContain('positive integer');
    expect(validatePriority(10000)).toContain('9999 or lower');
  });
});

describe('CredentialRules — getDefaultModel', () => {
  it('should resolve default model names correctly', () => {
    expect(getDefaultModel('openai', 'flagship')).toBe('gpt-4o');
    expect(getDefaultModel('openai', 'fast')).toBe('gpt-4o-mini');
    expect(getDefaultModel('anthropic', 'flagship')).toBe('claude-sonnet-4-5');
    expect(getDefaultModel('google', 'fast')).toBe('gemini-2.0-flash-lite');
  });
});
