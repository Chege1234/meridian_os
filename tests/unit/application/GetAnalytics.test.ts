import { describe, it, expect, vi } from 'vitest';
import { getCampaignPerformance } from '@/features/analytics/application/GetCampaignPerformance';
import { getContentPerformance } from '@/features/analytics/application/GetContentPerformance';
import { getCrmActivitySummary } from '@/features/analytics/application/GetCrmActivitySummary';
import { getAiUsageCost } from '@/features/analytics/application/GetAiUsageCost';
import type { AnalyticsRepository } from '@/domain/repositories';

describe('Analytics Use Cases', () => {
  const mockStartDate = new Date('2026-06-01T00:00:00Z');
  const mockEndDate = new Date('2026-06-30T23:59:59Z');

  describe('GetCampaignPerformance', () => {
    it('should query the AnalyticsRepository with correct parameters', async () => {
      const mockResult = [
        { date: '2026-06-15', reach: 500, clicks: 100, conversions: 10, signups: 5, revenue: 100 },
      ];

      const mockAnalyticsRepo = {
        getCampaignPerformance: vi.fn().mockResolvedValue(mockResult),
      } as unknown as AnalyticsRepository;

      const result = await getCampaignPerformance(
        {
          campaignId: 'camp-123',
          startDate: mockStartDate,
          endDate: mockEndDate,
          actorId: 'user-123',
          actorRole: 'admin',
        },
        { analyticsRepository: mockAnalyticsRepo }
      );

      expect(mockAnalyticsRepo.getCampaignPerformance).toHaveBeenCalledWith(
        'camp-123',
        { startDate: mockStartDate, endDate: mockEndDate },
        'user-123',
        'admin'
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });

    it('should return error if repository throws', async () => {
      const mockAnalyticsRepo = {
        getCampaignPerformance: vi.fn().mockRejectedValue(new Error('Database error')),
      } as unknown as AnalyticsRepository;

      const result = await getCampaignPerformance(
        {
          campaignId: null,
          startDate: mockStartDate,
          endDate: mockEndDate,
          actorId: 'user-123',
          actorRole: 'viewer',
        },
        { analyticsRepository: mockAnalyticsRepo }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('GetContentPerformance', () => {
    it('should retrieve content metrics and stage duration', async () => {
      const mockResult = {
        funnel: { draft: 5, review: 2, approved: 1, scheduled: 0, published: 10, archived: 0 },
        byPlatform: [{ platform: 'instagram', count: 12 }],
        byAuthor: [{ authorName: 'John', count: 18 }],
        aging: [{ contentItemId: 'item-1', title: 'Test', platform: 'instagram', timeInDraftHours: 24, timeInReviewHours: 12, timeInApprovedHours: 4, timeInScheduledHours: 0 }],
      };

      const mockAnalyticsRepo = {
        getContentPerformance: vi.fn().mockResolvedValue(mockResult),
      } as unknown as AnalyticsRepository;

      const result = await getContentPerformance(
        {
          startDate: mockStartDate,
          endDate: mockEndDate,
          platform: 'instagram',
          status: 'draft',
          actorId: 'user-123',
          actorRole: 'editor',
        },
        { analyticsRepository: mockAnalyticsRepo }
      );

      expect(mockAnalyticsRepo.getContentPerformance).toHaveBeenCalledWith(
        { startDate: mockStartDate, endDate: mockEndDate },
        'instagram',
        'draft',
        'user-123',
        'editor'
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });
  });

  describe('GetCrmActivitySummary', () => {
    it('should query CRM statistics', async () => {
      const mockResult = {
        contactsCreated: 15,
        interactionsByType: [{ type: 'call', count: 10 }],
        taskCompletionRate: 0.8,
        tasksTotal: 10,
        tasksCompleted: 8,
      };

      const mockAnalyticsRepo = {
        getCrmActivitySummary: vi.fn().mockResolvedValue(mockResult),
      } as unknown as AnalyticsRepository;

      const result = await getCrmActivitySummary(
        {
          startDate: mockStartDate,
          endDate: mockEndDate,
          actorId: 'user-123',
          actorRole: 'admin',
        },
        { analyticsRepository: mockAnalyticsRepo }
      );

      expect(mockAnalyticsRepo.getCrmActivitySummary).toHaveBeenCalledWith(
        { startDate: mockStartDate, endDate: mockEndDate },
        'user-123',
        'admin'
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });
  });

  describe('GetAiUsageCost', () => {
    it('should query AI usage and spending metrics', async () => {
      const mockResult = [
        { provider: 'openai', model: 'gpt-4', promptTitle: 'Generate Post', totalConversations: 15, totalTokens: 12000, estimatedCost: 0.24, userName: 'Alice' },
      ];

      const mockAnalyticsRepo = {
        getAiUsageCost: vi.fn().mockResolvedValue(mockResult),
      } as unknown as AnalyticsRepository;

      const result = await getAiUsageCost(
        {
          startDate: mockStartDate,
          endDate: mockEndDate,
          provider: 'openai',
          actorId: 'user-123',
          actorRole: 'owner',
        },
        { analyticsRepository: mockAnalyticsRepo }
      );

      expect(mockAnalyticsRepo.getAiUsageCost).toHaveBeenCalledWith(
        { startDate: mockStartDate, endDate: mockEndDate },
        'openai',
        'user-123',
        'owner'
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });
  });
});
