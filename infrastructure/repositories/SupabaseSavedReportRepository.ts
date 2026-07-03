/**
 * Infrastructure — Supabase Saved Report Repository
 *
 * Implements SavedReportRepository interface against Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedReport, CreateSavedReportInput } from '@/domain/entities';
import type { SavedReportRepository } from '@/domain/repositories';

export function createSupabaseSavedReportRepository(
  supabase: SupabaseClient,
): SavedReportRepository {
  return {
    async findById(id: string): Promise<SavedReport | null> {
      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return mapToSavedReport(data);
    },

    async findAllByUserId(userId: string): Promise<SavedReport[]> {
      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .or(`owner_id.eq.${userId},is_shared.eq.true`)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapToSavedReport);
    },

    async create(input: CreateSavedReportInput): Promise<SavedReport> {
      const { data, error } = await supabase
        .from('saved_reports')
        .insert({
          name: input.name,
          report_type: input.reportType,
          filters: input.filters ?? {},
          owner_id: input.ownerId,
          is_shared: input.isShared ?? false,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(`Failed to create saved report: ${error?.message}`);
      }

      return mapToSavedReport(data);
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('saved_reports')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete saved report: ${error.message}`);
      }
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapToSavedReport(row: any): SavedReport {
  return {
    id: row.id,
    name: row.name,
    reportType: row.report_type,
    filters: row.filters || {},
    ownerId: row.owner_id,
    isShared: row.is_shared,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
