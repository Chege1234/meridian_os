/**
 * Domain Rules — Setting Business Rules
 *
 * Per BR-1300: Workspace settings affect every user.
 * Per BR-1301: User settings affect only that user.
 * Per BR-1302: Branding changes update automatically.
 * Per BR-1303: Theme changes never require deployment.
 */

import type { Setting } from '@/domain/entities';

/**
 * Check whether a setting can be modified through the UI.
 */
export function isEditable(setting: Setting): boolean {
  return setting.editable;
}

/**
 * Validate setting value against its declared type.
 */
export function isValidSettingValue(value: string, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return !isNaN(Number(value));
    case 'boolean':
      return value === 'true' || value === 'false';
    case 'json': {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

/** Well-known workspace setting keys */
export const SETTING_KEYS = {
  WORKSPACE_NAME: 'workspace.name',
  WORKSPACE_DESCRIPTION: 'workspace.description',
  BRAND_LOGO: 'brand.logo',
  BRAND_PRIMARY_COLOR: 'brand.primaryColor',
  BRAND_FAVICON: 'brand.favicon',
} as const;
