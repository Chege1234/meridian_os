/**
 * Use Case — Get Setting
 *
 * Reads a setting by key.
 */

import type { SettingRepository } from '@/domain/repositories';
import type { SettingDto } from '@/application/dto';

interface Dependencies {
  settingRepository: SettingRepository;
}

export async function getSetting(
  key: string,
  deps: Dependencies,
): Promise<SettingDto | null> {
  const setting = await deps.settingRepository.findByKey(key);
  if (!setting) return null;

  return {
    key: setting.key,
    value: setting.value,
    type: setting.type,
    description: setting.description,
    editable: setting.editable,
  };
}
