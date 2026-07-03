import { describe, it, expect, vi } from 'vitest';
import { updateSetting } from '@/application/use-cases/UpdateSetting';
import type { SettingRepository } from '@/domain/repositories';
import type { Setting } from '@/domain/entities';

describe('UpdateSetting Use Case', () => {
  const mockSetting = (overrides?: Partial<Setting>): Setting => ({
    id: '1',
    key: 'workspace.name',
    value: 'Campus Marketplace',
    type: 'string',
    description: null,
    editable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  it('should update an editable setting with a valid value', async () => {
    const setting = mockSetting();
    const mockSettingRepo = {
      findByKey: vi.fn().mockResolvedValue(setting),
      update: vi.fn().mockResolvedValue(setting),
    } as unknown as SettingRepository;

    const result = await updateSetting(
      { key: 'workspace.name', value: 'New Name' },
      { settingRepository: mockSettingRepo },
    );

    expect(result.success).toBe(true);
    expect(mockSettingRepo.update).toHaveBeenCalledWith('workspace.name', 'New Name');
  });

  it('should fail if setting is not found', async () => {
    const mockSettingRepo = {
      findByKey: vi.fn().mockResolvedValue(null),
    } as unknown as SettingRepository;

    const result = await updateSetting(
      { key: 'non-existent', value: 'value' },
      { settingRepository: mockSettingRepo },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should fail if setting is not editable', async () => {
    const setting = mockSetting({ editable: false });
    const mockSettingRepo = {
      findByKey: vi.fn().mockResolvedValue(setting),
    } as unknown as SettingRepository;

    const result = await updateSetting(
      { key: 'workspace.name', value: 'New Name' },
      { settingRepository: mockSettingRepo },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('not editable');
  });

  it('should fail if setting value type is invalid', async () => {
    const setting = mockSetting({ type: 'number' });
    const mockSettingRepo = {
      findByKey: vi.fn().mockResolvedValue(setting),
    } as unknown as SettingRepository;

    const result = await updateSetting(
      { key: 'workspace.name', value: 'not-a-number' },
      { settingRepository: mockSettingRepo },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid value for type');
  });
});
