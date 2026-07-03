/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/infrastructure/supabase/server';
import { createArticle } from '@/features/knowledge-base/application/CreateArticle';
import { updateArticle } from '@/features/knowledge-base/application/UpdateArticle';
import { transitionArticleStatus } from '@/features/knowledge-base/application/TransitionArticleStatus';
import { createSop } from '@/features/sops/application/CreateSop';
import { updateSop } from '@/features/sops/application/UpdateSop';
import { isSopOverdue } from '@/domain/rules/SopRules';
import {
  createSupabaseKbArticleRepository,
  createSupabaseSopRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';

vi.mock('@/infrastructure/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Knowledge Base & SOPs Versioning Flow', () => {
  let mockSupabase: any;
  let articleRepo: any;
  let sopRepo: any;
  let activityLogRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      currentTable: '',
      from: vi.fn().mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      }),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        const table = mockSupabase.currentTable;
        if (table === 'kb_articles') {
          return Promise.resolve({
            data: {
              id: 'article-123',
              category_id: 'cat-123',
              title: 'Draft Article',
              slug: 'draft-article',
              status: 'draft',
              author_id: 'user-123',
              current_version_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        if (table === 'sops') {
          return Promise.resolve({
            data: {
              id: 'sop-123',
              title: 'Draft SOP',
              category_id: 'cat-123',
              status: 'draft',
              owner_id: 'user-123',
              current_version_id: null,
              review_due_date: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        if (table === 'activity_logs') {
          return Promise.resolve({
            data: {
              id: 'log-123',
              user_id: 'user-123',
              action: 'action',
              module: 'module',
              created_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    articleRepo = createSupabaseKbArticleRepository(mockSupabase);
    sopRepo = createSupabaseSopRepository(mockSupabase);
    activityLogRepo = createSupabaseActivityLogRepository(mockSupabase);
  });

  describe('KB Article Versioning and Transition Use Cases', () => {
    it('should create article draft, transition to review, publish it, and save subsequent versions', async () => {
      // Mock article repository methods used in createArticle
      vi.spyOn(articleRepo, 'findBySlug').mockResolvedValue(null);
      vi.spyOn(articleRepo, 'create').mockResolvedValue({
        id: 'article-123',
        categoryId: 'cat-123',
        title: 'How to use VPN',
        slug: 'how-to-use-vpn',
        status: 'draft',
        authorId: 'user-123',
        currentVersionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
      });

      const mockVersion = {
        id: 'version-1',
        articleId: 'article-123',
        title: 'How to use VPN',
        content: 'Connect to vpn.meridian.com using credentials.',
        summary: 'Initial version',
        authorId: 'user-123',
        createdAt: new Date(),
      };
      vi.spyOn(articleRepo, 'createVersion').mockResolvedValue(mockVersion);

      // A: Create Article
      const createResult = await createArticle(
        {
          categoryId: 'cat-123',
          title: 'How to use VPN',
          content: 'Connect to vpn.meridian.com using credentials.',
          authorId: 'user-123',
        },
        {
          kbArticleRepository: articleRepo,
          activityLogRepository: activityLogRepo,
        }
      );

      expect(createResult.success).toBe(true);
      expect(createResult.article?.id).toBe('article-123');
      expect(createResult.article?.status).toBe('draft');

      // B: Transition to Review
      vi.spyOn(articleRepo, 'findById').mockResolvedValue(createResult.article as any);
      const updateToReviewMock = {
        ...createResult.article,
        status: 'review',
      };
      vi.spyOn(articleRepo, 'update').mockResolvedValue(updateToReviewMock as any);

      const reviewTransition = await transitionArticleStatus(
        {
          id: 'article-123',
          status: 'review',
          actorId: 'user-123',
          actorRoleName: 'editor',
        },
        {
          kbArticleRepository: articleRepo,
          activityLogRepository: activityLogRepo,
        }
      );
      expect(reviewTransition.success).toBe(true);
      expect(reviewTransition.article?.status).toBe('review');

      // C: Transition to Published (asserts setting currentVersionId to version-1)
      vi.spyOn(articleRepo, 'findById').mockResolvedValue(reviewTransition.article as any);
      vi.spyOn(articleRepo, 'findVersionHistory').mockResolvedValue([mockVersion]);
      
      const publishMock = {
        ...reviewTransition.article,
        status: 'published',
        currentVersionId: 'version-1',
      };
      vi.spyOn(articleRepo, 'update').mockResolvedValue(publishMock as any);

      const publishTransition = await transitionArticleStatus(
        {
          id: 'article-123',
          status: 'published',
          actorId: 'user-123',
          actorRoleName: 'editor',
        },
        {
          kbArticleRepository: articleRepo,
          activityLogRepository: activityLogRepo,
        }
      );
      expect(publishTransition.success).toBe(true);
      expect(publishTransition.article?.status).toBe('published');
      expect(publishTransition.article?.currentVersionId).toBe('version-1');

      // D: Update content should create a new version (v2)
      vi.spyOn(articleRepo, 'findById').mockResolvedValue(publishTransition.article as any);
      
      const mockVersion2 = {
        id: 'version-2',
        articleId: 'article-123',
        title: 'How to use VPN (Updated)',
        content: 'New content: Connect to vpn.meridian.com using Okta MFA.',
        summary: 'Updated connection steps',
        authorId: 'user-123',
        createdAt: new Date(),
      };
      vi.spyOn(articleRepo, 'createVersion').mockResolvedValue(mockVersion2);
      
      const updateMock = {
        ...publishTransition.article,
        title: 'How to use VPN (Updated)',
        currentVersionId: 'version-2',
      };
      vi.spyOn(articleRepo, 'update').mockResolvedValue(updateMock as any);

      const updateResult = await updateArticle(
        {
          id: 'article-123',
          data: {
            title: 'How to use VPN (Updated)',
            content: 'New content: Connect to vpn.meridian.com using Okta MFA.',
            summary: 'Updated connection steps',
            authorId: 'user-123',
          },
        },
        {
          kbArticleRepository: articleRepo,
          activityLogRepository: activityLogRepo,
        }
      );

      if (!updateResult.success) {
        console.error('updateArticle failed with error:', updateResult.error);
      }
      expect(updateResult.success).toBe(true);
      expect(updateResult.article?.currentVersionId).toBe('version-2');
    });
  });

  describe('SOP Checklist Versioning and Overdue Detection Use Cases', () => {
    it('should create an SOP and detect if it is overdue based on rules', async () => {
      // Mock SOP repo create
      const mockSop = {
        id: 'sop-123',
        title: 'Weekly DB Backup',
        categoryId: null,
        status: 'published',
        ownerId: 'user-123',
        currentVersionId: 'v1-id',
        reviewDueDate: new Date(Date.now() - 5000), // 5 seconds in past
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
      };

      vi.spyOn(sopRepo, 'create').mockResolvedValue(mockSop as any);
      vi.spyOn(sopRepo, 'update').mockResolvedValue(mockSop as any);
      vi.spyOn(sopRepo, 'createVersion').mockResolvedValue({
        id: 'v1-id',
        sopId: 'sop-123',
        title: 'Weekly DB Backup',
        steps: [{ order: 0, instruction: 'Click backup' }],
        summary: 'v1',
        authorId: 'user-123',
        createdAt: new Date(),
      });

      const result = await createSop(
        {
          title: 'Weekly DB Backup',
          ownerId: 'user-123',
          steps: [{ order: 0, instruction: 'Click backup' }],
          reviewDueDate: new Date(Date.now() - 5000),
          status: 'published',
        },
        {
          sopRepository: sopRepo,
          activityLogRepository: activityLogRepo,
        }
      );

      if (!result.success) {
        console.error('createSop failed with error:', result.error);
      }
      expect(result.success).toBe(true);
      expect(result.sop?.status).toBe('published');

      // Verify that this SOP is flagged as overdue
      const overdue = isSopOverdue(result.sop as any);
      expect(overdue).toBe(true);
    });
  });
});
