/**
 * Domain — Repository Interfaces Barrel
 */

export type { UserRepository } from './UserRepository';
export type { RoleRepository } from './RoleRepository';
export type { ActivityLogRepository } from './ActivityLogRepository';
export type { SettingRepository } from './SettingRepository';
export type { ContactRepository } from './ContactRepository';
export type { ContactInteractionRepository } from './ContactInteractionRepository';
export type { TaskRepository } from './TaskRepository';
export type { PromptRepository } from './PromptRepository';
export type { ContentRepository } from './ContentRepository';
export type { AiConversationRepository } from './AiConversationRepository';
export type { CampaignRepository } from './CampaignRepository';
export type { DashboardRepository } from './DashboardRepository';
export type { SavedReportRepository } from './SavedReportRepository';
export type {
  AnalyticsRepository,
  CampaignPerformanceMetric,
  ContentPerformance,
  ContentStatusFunnel,
  ContentVolumeByPlatform,
  ContentVolumeByAuthor,
  ContentAgingInReview,
  CrmActivitySummary,
  AiUsageCost,
} from './AnalyticsRepository';

