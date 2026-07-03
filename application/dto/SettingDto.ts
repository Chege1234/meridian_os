/**
 * Application DTO — Setting
 *
 * Data transfer objects for settings.
 */

export interface SettingDto {
  readonly key: string;
  readonly value: string;
  readonly type: string;
  readonly description: string | null;
  readonly editable: boolean;
}

export interface UpdateSettingDto {
  readonly key: string;
  readonly value: string;
}
