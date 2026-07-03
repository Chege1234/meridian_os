import { describe, it, expect } from 'vitest';
import {
  isEditable,
  isValidSettingValue,
} from '@/domain/rules/SettingRules';
import type { Setting } from '@/domain/entities';

describe('SettingRules', () => {
  const mockSetting = (overrides?: Partial<Setting>): Setting => ({
    id: '1',
    key: 'test.key',
    value: 'value',
    type: 'string',
    description: 'desc',
    editable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe('isEditable', () => {
    it('should return true if setting is marked editable', () => {
      expect(isEditable(mockSetting({ editable: true }))).toBe(true);
    });

    it('should return false if setting is marked not editable', () => {
      expect(isEditable(mockSetting({ editable: false }))).toBe(false);
    });
  });

  describe('isValidSettingValue', () => {
    it('should validate string types', () => {
      expect(isValidSettingValue('hello', 'string')).toBe(true);
    });

    it('should validate number types', () => {
      expect(isValidSettingValue('123', 'number')).toBe(true);
      expect(isValidSettingValue('12.3', 'number')).toBe(true);
      expect(isValidSettingValue('abc', 'number')).toBe(false);
    });

    it('should validate boolean types', () => {
      expect(isValidSettingValue('true', 'boolean')).toBe(true);
      expect(isValidSettingValue('false', 'boolean')).toBe(true);
      expect(isValidSettingValue('yes', 'boolean')).toBe(false);
    });

    it('should validate json types', () => {
      expect(isValidSettingValue('{"foo": "bar"}', 'json')).toBe(true);
      expect(isValidSettingValue('[1, 2, 3]', 'json')).toBe(true);
      expect(isValidSettingValue('{invalid}', 'json')).toBe(false);
    });
  });
});
