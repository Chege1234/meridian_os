'use server';

/**
 * Server Actions — Knowledge Base
 *
 * Secure entrypoint for Client Components to invoke KB Use Cases.
 */

import { getAuthenticatedActor } from '@/infrastructure/auth';
import {
  createSupabaseKbCategoryRepository,
  createSupabaseKbArticleRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';
import { createCategory } from './application/CreateCategory';
import { moveCategory } from './application/MoveCategory';
import { createArticle } from './application/CreateArticle';
import { updateArticle } from './application/UpdateArticle';
import { transitionArticleStatus } from './application/TransitionArticleStatus';
import { archiveArticle } from './application/ArchiveArticle';
import { searchArticles } from './application/SearchArticles';
import {
  createCategorySchema,
  createArticleSchema,
  updateArticleSchema,
} from './schemas';
import type {
  CreateCategorySchemaInput,
  CreateArticleSchemaInput,
  UpdateArticleSchemaInput,
} from './schemas';

export async function getCategoriesAction() {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const categoryRepository = createSupabaseKbCategoryRepository(supabase);
    const categories = await categoryRepository.findAll();
    return { success: true, categories };
  } catch (err: any) {
    return { success: false, categories: [], error: err.message };
  }
}

export async function createCategoryAction(rawInput: CreateCategorySchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createCategorySchema.parse(rawInput);

    const categoryRepository = createSupabaseKbCategoryRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createCategory(
      {
        name: input.name,
        parentCategoryId: input.parentCategoryId,
        position: input.position,
        createdBy: actor.id,
      },
      { kbCategoryRepository: categoryRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function moveCategoryAction(args: { id: string; parentCategoryId: string | null; position?: number }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const categoryRepository = createSupabaseKbCategoryRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await moveCategory(
      {
        id: args.id,
        parentCategoryId: args.parentCategoryId,
        position: args.position,
        actorId: actor.id,
      },
      { kbCategoryRepository: categoryRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getArticlesAction(args: { search?: string; categoryId?: string; status?: string }) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const articleRepository = createSupabaseKbArticleRepository(supabase);

    const result = await searchArticles(args, { kbArticleRepository: articleRepository });
    return result;
  } catch (err: any) {
    return { success: false, articles: [], error: err.message };
  }
}

export async function getArticleDetailAction(articleId: string) {
  try {
    const { supabase } = await getAuthenticatedActor(false);
    const articleRepository = createSupabaseKbArticleRepository(supabase);

    const [article, versions] = await Promise.all([
      articleRepository.findById(articleId),
      articleRepository.findVersionHistory(articleId),
    ]);

    if (!article) {
      return { success: false, error: 'Article not found.' };
    }

    return {
      success: true,
      article,
      versions,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function createArticleAction(rawInput: CreateArticleSchemaInput) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = createArticleSchema.parse(rawInput);

    const articleRepository = createSupabaseKbArticleRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await createArticle(
      {
        ...input,
        authorId: actor.id,
      },
      { kbArticleRepository: articleRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateArticleAction(args: { id: string; data: UpdateArticleSchemaInput }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);
    const input = updateArticleSchema.parse(args.data);

    const articleRepository = createSupabaseKbArticleRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await updateArticle(
      {
        id: args.id,
        data: {
          ...input,
          authorId: actor.id,
        },
      },
      { kbArticleRepository: articleRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function transitionArticleStatusAction(args: { id: string; status: 'draft' | 'review' | 'published' | 'archived' }) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const articleRepository = createSupabaseKbArticleRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await transitionArticleStatus(
      {
        id: args.id,
        status: args.status,
        actorId: actor.id,
        actorRoleName: actor.role.name,
      },
      { kbArticleRepository: articleRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function archiveArticleAction(articleId: string) {
  try {
    const { actor, supabase } = await getAuthenticatedActor(true);

    const articleRepository = createSupabaseKbArticleRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);

    const result = await archiveArticle(
      {
        id: articleId,
        actorId: actor.id,
      },
      { kbArticleRepository: articleRepository, activityLogRepository },
    );

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
