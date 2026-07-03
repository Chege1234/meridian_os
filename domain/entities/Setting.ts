/**
 * Domain Entity — Setting
 *
 * Key-value workspace setting. Framework-independent.
 */

export type SettingType = 'string' | 'number' | 'boolean' | 'json';

export interface Setting {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly type: SettingType;
  readonly description: string | null;
  readonly editable: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
