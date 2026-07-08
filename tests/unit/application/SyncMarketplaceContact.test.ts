import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncMarketplaceContact } from '@/application/use-cases/SyncMarketplaceContact';
import type { ContactRepository, ActivityLogRepository } from '@/domain/repositories';
import type { Contact } from '@/domain/entities';

describe('SyncMarketplaceContact Use Case', () => {
  let mockContactRepository: any;
  let mockActivityLogRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContactRepository = {
      findByExternalId: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((data) => Promise.resolve({
        id: 'new-uuid',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
      })),
      update: vi.fn().mockImplementation((id, data) => Promise.resolve({
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
      })),
    };

    mockActivityLogRepository = {
      create: vi.fn().mockResolvedValue({ id: 'log-uuid' }),
    };
  });

  it('should create a new synced contact when none exists', async () => {
    const input = {
      id: '12345',
      username: 'student123',
      email: 'student@campus.edu',
      phone: '123-456-7890',
      role: 'student',
      avatar: 'avatar.png',
      isVerified: true,
      createdAt: new Date(),
      studentId: 'S12345',
      preferredLanguage: 'en',
      lastSeenAt: new Date(),
      accountStatus: 'active',
      homeTown: 'Springfield',
    };

    const result = await syncMarketplaceContact(input, {
      contactRepository: mockContactRepository,
      activityLogRepository: mockActivityLogRepository,
    });

    expect(result.success).toBe(true);
    expect(result.contact).toBeDefined();
    expect(result.contact?.name).toBe('student123');
    expect(result.contact?.source).toBe('campus_marketplace');
    expect(result.contact?.externalId).toBe('12345');
    expect(result.contact?.createdBy).toBeNull();
    expect(result.contact?.metadata).toEqual({
      marketplaceRole: 'student',
      accountStatus: 'active',
      homeTown: 'Springfield',
      preferredLanguage: 'en',
      studentId: 'S12345',
      avatar: 'avatar.png',
      lastSeenAt: input.lastSeenAt.toISOString(),
    });

    expect(mockContactRepository.create).toHaveBeenCalled();
    expect(mockContactRepository.update).not.toHaveBeenCalled();
  });

  it('should update an existing synced contact', async () => {
    const existingContact: Contact = {
      id: 'existing-uuid',
      name: 'old-username',
      organization: null,
      email: 'old@campus.edu',
      phone: '000-000-0000',
      status: 'active',
      notes: 'some notes',
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
      source: 'campus_marketplace',
      externalId: '12345',
      syncedAt: new Date(),
      metadata: {},
    };

    mockContactRepository.findByExternalId.mockResolvedValue([existingContact]);

    const input = {
      id: '12345',
      username: 'new-username',
      email: 'new@campus.edu',
      phone: '123-456-7890',
      role: 'student',
      avatar: 'new_avatar.png',
      isVerified: true,
      createdAt: new Date(),
      studentId: 'S12345',
      preferredLanguage: 'es',
      lastSeenAt: new Date(),
      accountStatus: 'active',
      homeTown: 'Springfield',
    };

    const result = await syncMarketplaceContact(input, {
      contactRepository: mockContactRepository,
      activityLogRepository: mockActivityLogRepository,
    });

    expect(result.success).toBe(true);
    expect(result.contact?.id).toBe('existing-uuid');
    expect(result.contact?.name).toBe('new-username');
    expect(result.contact?.email).toBe('new@campus.edu');
    expect(result.contact?.phone).toBe('123-456-7890');
    expect(result.contact?.metadata).toEqual({
      marketplaceRole: 'student',
      accountStatus: 'active',
      homeTown: 'Springfield',
      preferredLanguage: 'es',
      studentId: 'S12345',
      avatar: 'new_avatar.png',
      lastSeenAt: input.lastSeenAt.toISOString(),
    });

    expect(mockContactRepository.update).toHaveBeenCalledWith('existing-uuid', expect.any(Object));
    expect(mockContactRepository.create).not.toHaveBeenCalled();
  });

  it('should skip syncing and log activity if a manual contact exists with the same external_id', async () => {
    const manualContact: Contact = {
      id: 'manual-uuid',
      name: 'Manual User',
      organization: 'Meridian',
      email: 'manual@campus.edu',
      phone: '111-222-3333',
      status: 'active',
      notes: 'Manually entered contact notes',
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
      source: 'manual',
      externalId: '12345',
      syncedAt: null,
      metadata: null,
    };

    mockContactRepository.findByExternalId.mockResolvedValue([manualContact]);

    const input = {
      id: '12345',
      username: 'student123',
      email: 'student@campus.edu',
      phone: '123-456-7890',
      role: 'student',
      avatar: 'avatar.png',
      isVerified: true,
      createdAt: new Date(),
      studentId: 'S12345',
      preferredLanguage: 'en',
      lastSeenAt: new Date(),
      accountStatus: 'active',
      homeTown: 'Springfield',
    };

    const result = await syncMarketplaceContact(input, {
      contactRepository: mockContactRepository,
      activityLogRepository: mockActivityLogRepository,
    });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.contact).toBeUndefined();

    expect(mockContactRepository.create).not.toHaveBeenCalled();
    expect(mockContactRepository.update).not.toHaveBeenCalled();

    expect(mockActivityLogRepository.create).toHaveBeenCalledWith({
      userId: null,
      action: 'contact.sync_skipped',
      module: 'crm',
      entity: 'contact',
      metadata: {
        externalId: '12345',
        reason: 'Manual contact exists with same external ID',
        username: 'student123',
      },
    });
  });

  it('should reject unverified users defensively', async () => {
    const input = {
      id: '12345',
      username: 'student123',
      email: 'student@campus.edu',
      phone: '123-456-7890',
      role: 'student',
      avatar: 'avatar.png',
      isVerified: false,
      createdAt: new Date(),
      studentId: 'S12345',
      preferredLanguage: 'en',
      lastSeenAt: new Date(),
      accountStatus: 'active',
      homeTown: 'Springfield',
    };

    const result = await syncMarketplaceContact(input, {
      contactRepository: mockContactRepository,
      activityLogRepository: mockActivityLogRepository,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot sync unverified user');
    expect(mockContactRepository.create).not.toHaveBeenCalled();
    expect(mockContactRepository.update).not.toHaveBeenCalled();
  });
});
