/**
 * Domain Repository Interface — Saved Report
 *
 * Interface only — implementation in infrastructure layer.
 */

import type { SavedReport, CreateSavedReportInput } from '@/domain/entities';

export interface SavedReportRepository {
  findById(id: string): Promise<SavedReport | null>;
  findAllByUserId(userId: string): Promise<SavedReport[]>;
  create(data: CreateSavedReportInput): Promise<SavedReport>;
  delete(id: string): Promise<void>;
}
