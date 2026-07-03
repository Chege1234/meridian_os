/**
 * Domain Entity — Saved Report
 *
 * Core Saved Report configurations. Framework-independent.
 */

export type ReportType = 'campaign_performance' | 'content_performance' | 'crm_activity' | 'ai_usage_cost';

export interface SavedReport {
  readonly id: string;
  readonly name: string;
  readonly reportType: ReportType;
  readonly filters: Record<string, any>;
  readonly ownerId: string;
  readonly isShared: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateSavedReportInput {
  readonly name: string;
  readonly reportType: ReportType;
  readonly filters: Record<string, any>;
  readonly ownerId: string;
  readonly isShared?: boolean;
}
