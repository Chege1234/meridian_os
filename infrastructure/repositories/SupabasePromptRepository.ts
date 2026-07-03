/**
 * Infrastructure — Supabase Prompt Repository
 *
 * Implements PromptRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Prompt, PromptVersion, CreatePromptInput } from '@/domain/entities';
import type { PromptRepository } from '@/domain/repositories';

export function createSupabasePromptRepository(
  supabase: SupabaseClient,
): PromptRepository {
  return {
    async findById(id: string): Promise<Prompt | null> {
      const { data } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      return data ? mapToPrompt(data) : null;
    },

    async findByTitle(title: string): Promise<Prompt | null> {
      const { data } = await supabase
        .from('prompts')
        .select('*')
        .eq('title', title)
        .is('deleted_at', null)
        .single();

      return data ? mapToPrompt(data) : null;
    },

    async findActiveByPromptId(promptId: string): Promise<PromptVersion | null> {
      // First, get the prompt version number
      const { data: prompt } = await supabase
        .from('prompts')
        .select('version, status')
        .eq('id', promptId)
        .is('deleted_at', null)
        .single();

      if (!prompt) return null;

      // Find the prompt version matching this version number
      const { data } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .eq('version', prompt.version)
        .single();

      return data ? mapToPromptVersion(data) : null;
    },

    async findVersionHistory(promptId: string): Promise<PromptVersion[]> {
      const { data } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version', { ascending: false });

      return (data ?? []).map(mapToPromptVersion);
    },

    async findAll(options?: {
      search?: string;
      status?: string;
      includeDeleted?: boolean;
    }): Promise<Prompt[]> {
      let query = supabase.from('prompts').select('*');

      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.search) {
        const s = `%${options.search}%`;
        query = query.or(`title.ilike.${s},description.ilike.${s},prompt.ilike.${s}`);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return (data ?? []).map(mapToPrompt);
    },

    async create(data: CreatePromptInput): Promise<Prompt> {
      const { data: row, error } = await supabase
        .from('prompts')
        .insert({
          title: data.title,
          description: data.description ?? null,
          prompt: data.prompt,
          variables: data.variables || [],
          provider: data.provider,
          version: 1,
          status: data.status || 'draft',
          usage_count: 0,
          created_by: data.createdBy,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to create prompt: ${error?.message}`);
      }

      return mapToPrompt(row);
    },

    async update(
      id: string,
      data: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<Prompt | null> {
      const dbData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) dbData.title = data.title;
      if (data.description !== undefined) dbData.description = data.description;
      if (data.prompt !== undefined) dbData.prompt = data.prompt;
      if (data.variables !== undefined) dbData.variables = data.variables;
      if (data.provider !== undefined) dbData.provider = data.provider;
      if (data.version !== undefined) dbData.version = data.version;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.deletedAt !== undefined) dbData.deleted_at = data.deletedAt?.toISOString() || null;
      if (data.deletedBy !== undefined) dbData.deleted_by = data.deletedBy;

      const { data: row } = await supabase
        .from('prompts')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();

      return row ? mapToPrompt(row) : null;
    },

    async createVersion(data: {
      promptId: string;
      version: number;
      prompt: string;
      variables: readonly string[];
      authorId: string;
      summary: string | null;
    }): Promise<PromptVersion> {
      const { data: row, error } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: data.promptId,
          version: data.version,
          prompt: data.prompt,
          variables: data.variables || [],
          author_id: data.authorId,
          summary: data.summary ?? null,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw new Error(`Failed to save prompt version snapshot: ${error?.message}`);
      }

      return mapToPromptVersion(row);
    },

    async incrementUsageCount(id: string): Promise<void> {
      try {
        const { error } = await supabase.rpc('increment_prompt_usage', { prompt_id: id });
        if (error) throw error;
      } catch (err) {
        // Fallback if RPC doesn't exist yet
        const { data: p } = await supabase
          .from('prompts')
          .select('usage_count')
          .eq('id', id)
          .single();
        if (p) {
          await supabase
            .from('prompts')
            .update({ usage_count: (p.usage_count || 0) + 1 })
            .eq('id', id);
        }
      }
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToPrompt(row: any): Prompt {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    prompt: row.prompt,
    variables: row.variables || [],
    provider: row.provider,
    version: row.version,
    status: row.status,
    usageCount: row.usage_count || 0,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedBy: row.deleted_by,
  };
}

function mapToPromptVersion(row: any): PromptVersion {
  return {
    id: row.id,
    promptId: row.prompt_id,
    version: row.version,
    prompt: row.prompt,
    variables: row.variables || [],
    authorId: row.author_id,
    summary: row.summary,
    createdAt: new Date(row.created_at),
  };
}
