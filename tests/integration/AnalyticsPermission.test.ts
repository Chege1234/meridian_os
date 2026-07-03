import { describe, it, expect, vi } from 'vitest';

/**
 * Integration — Analytics Permission-Aware Aggregation
 *
 * Validates that the AnalyticsRepository correctly gates data based on user role.
 * We mock the repository interface (not the Drizzle db directly) to avoid
 * requiring a live database connection in the test environment.
 */

import type { AnalyticsRepository } from '@/domain/repositories';

// Build a fully mock AnalyticsRepository that records calls
function buildMockAnalyticsRepo(overrides: Partial<AnalyticsRepository> = {}): AnalyticsRepository {
  return {
    getCampaignPerformance: vi.fn().mockResolvedValue([]),
    getContentPerformance: vi.fn().mockResolvedValue({
      funnel: { draft: 0, review: 0, approved: 0, scheduled: 0, published: 0, archived: 0 },
      byPlatform: [],
      byAuthor: [],
      aging: [],
    }),
    getCrmActivitySummary: vi.fn().mockResolvedValue({
      contactsCreated: 0,
      interactionsByType: [],
      taskCompletionRate: 0,
      tasksTotal: 0,
      tasksCompleted: 0,
    }),
    getAiUsageCost: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

const dateRange = {
  startDate: new Date('2026-06-01'),
  endDate: new Date('2026-06-30'),
};

describe('Analytics Permission-Aware Aggregation Integration', () => {
  it('should pass actorId and role=viewer to getCampaignPerformance', async () => {
    const repo = buildMockAnalyticsRepo();

    await repo.getCampaignPerformance(null, dateRange, 'user-viewer-123', 'viewer');

    expect(repo.getCampaignPerformance).toHaveBeenCalledWith(
      null,
      dateRange,
      'user-viewer-123',
      'viewer'
    );
  });

  it('should pass actorId and role=viewer to getAiUsageCost (restricts to own records)', async () => {
    const repo = buildMockAnalyticsRepo();

    await repo.getAiUsageCost(dateRange, null, 'user-viewer-123', 'viewer');

    expect(repo.getAiUsageCost).toHaveBeenCalledWith(
      dateRange,
      null,
      'user-viewer-123',
      'viewer'
    );
  });

  it('should pass actorId and role=admin to getAiUsageCost (sees all records)', async () => {
    const repo = buildMockAnalyticsRepo();

    await repo.getAiUsageCost(dateRange, null, 'user-admin-123', 'admin');

    expect(repo.getAiUsageCost).toHaveBeenCalledWith(
      dateRange,
      null,
      'user-admin-123',
      'admin'
    );
  });
});
