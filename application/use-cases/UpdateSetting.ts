/**
 * Use Case — Update Setting
 *
 * Updates a workspace setting with validation.
 * Per BR-1301/1302/1303: workspace settings affect everyone,
 * branding changes propagate automatically, no redeploy required.
 */

import type { SettingRepository } from '@/domain/repositories';
import type { UpdateSettingDto } from '@/application/dto';
import { isEditable, isValidSettingValue } from '@/domain/rules';

interface Dependencies {
  settingRepository: SettingRepository;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function updateSetting(
  data: UpdateSettingDto,
  deps: Dependencies,
): Promise<Result> {
  const existing = await deps.settingRepository.findByKey(data.key);
  if (!existing) {
    return { success: false, error: `Setting "${data.key}" not found.` };
  }

  if (!isEditable(existing)) {
    return {
      success: false,
      error: `Setting "${data.key}" is not editable.`,
    };
  }

  if (!isValidSettingValue(data.value, existing.type)) {
    return {
      success: false,
      error: `Invalid value for type "${existing.type}".`,
    };
  }

  await deps.settingRepository.update(data.key, data.value);

  return { success: true };
}
