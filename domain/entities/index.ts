/**
 * Domain — Entities Barrel
 */

export type { User, UserStatus, UserWithRole } from './User';
export type { Role, SystemRoleName } from './Role';
export { SYSTEM_ROLES } from './Role';
export type { Permission } from './Permission';
export type { ActivityLog, CreateActivityLogInput } from './ActivityLog';
export type { Setting, SettingType } from './Setting';
export type { Contact, ContactStatus, CreateContactInput, UpdateContactInput } from './Contact';
export type { ContactInteraction, InteractionType, LogInteractionInput } from './ContactInteraction';
export type { Task, TaskPriority, TaskStatus, CreateTaskInput, UpdateTaskInput } from './Task';
export type { Prompt, PromptVersion, CreatePromptInput, UpdatePromptInput, PromptProvider, PromptStatus } from './Prompt';
export type { ContentItem, ContentVersion, ContentMedia, CreateContentInput, UpdateContentInput, ContentPlatform, ContentType, ContentStatus } from './ContentItem';
export type { AiConversation, TokenUsage, CreateAiConversationInput } from './AiConversation';
export type {
  Campaign,
  CampaignStatus,
  CampaignContactRole,
  CampaignMetricName,
  CampaignMetricSource,
  CampaignContent,
  CampaignContact,
  CampaignMetric,
  CreateCampaignInput,
  UpdateCampaignInput,
} from './Campaign';

export type { Dashboard, CreateDashboardInput, UpdateDashboardInput, DashboardWidget, WidgetType } from './Dashboard';
export type { SavedReport, CreateSavedReportInput, ReportType } from './SavedReport';
export type {
  MediaAsset,
  MediaFolder,
  MediaAssetStatus,
  CreateMediaAssetInput,
  UpdateMediaAssetInput,
  CreateMediaFolderInput,
  DuplicateAssetResult,
} from './MediaAsset';
export type {
  BrandAsset,
  BrandGuideline,
  BrandAssetType,
  BrandAssetValue,
  ColorPaletteValue,
  FontValue,
  LogoValue,
  CreateBrandAssetInput,
  UpdateBrandAssetInput,
  PublishBrandGuidelineInput,
  ActiveBrandKit,
} from './BrandAsset';

export type {
  KbArticleStatus,
  KbCategory,
  KbArticle,
  KbArticleVersion,
  CreateCategoryInput,
  CreateArticleInput,
  UpdateArticleInput,
} from './KbArticle';

export {
  SopStatus,
  SopStep,
  Sop,
  SopVersion,
  CreateSopInput,
  UpdateSopInput,
} from './Sop';

export type {
  AutomationTriggerType,
  AutomationTriggerConfig,
  AutomationActionType,
  AutomationActionConfig,
  AutomationStatus,
  Automation,
  AutomationRunStatus,
  AutomationRun,
  CreateAutomationInput,
  UpdateAutomationInput,
  CreateAutomationRunInput,
} from './Automation';

export type {
  AgentStatus,
  AgentRunTrigger,
  AgentRunStatus,
  AgentProposedAction,
  AgentExecutedAction,
  Agent,
  AgentRun,
  CreateAgentInput,
  UpdateAgentInput,
  CreateAgentRunInput,
} from './Agent';
