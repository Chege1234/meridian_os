/**
 * Infrastructure — Supabase Schema
 *
 * Barrel file re-exporting all Drizzle table definitions.
 */

export { roles } from './roles';
export { users, userStatusEnum } from './users';
export { permissions } from './permissions';
export { rolePermissions } from './role-permissions';
export { activityLogs } from './activity-logs';
export { settings, settingTypeEnum } from './settings';
export { contacts } from './contacts';
export { contactInteractions, contactInteractionTypeEnum } from './contact-interactions';
export { tasks, taskPriorityEnum, taskStatusEnum } from './tasks';
export { prompts } from './prompts';
export { promptVersions } from './prompt-versions';
export { contentItems } from './content-items';
export { contentVersions } from './content-versions';
export { mediaFolders } from './media-folders';
export { mediaAssets, mediaAssetStatusEnum } from './media-assets';
export { contentMedia } from './content-media';
export { brandAssets, brandAssetTypeEnum } from './brand-assets';
export { brandGuidelines } from './brand-guidelines';
export { aiConversations } from './ai-conversations';
export { campaigns, campaignStatusEnum } from './campaigns';
export { campaignContent } from './campaign-content';
export { campaignContacts, campaignContactRoleEnum } from './campaign-contacts';
export { campaignMetrics, campaignMetricNameEnum, campaignMetricSourceEnum } from './campaign-metrics';
export { dashboards } from './dashboards';
export { savedReports, reportTypeEnum } from './saved-reports';
export { kbCategories } from './kb-categories';
export { kbArticles, kbArticleVersions, kbArticleStatusEnum } from './kb-articles';
export { sops, sopVersions, sopStatusEnum } from './sops';
export {
  automations,
  automationRuns,
  automationTriggerTypeEnum,
  automationActionTypeEnum,
  automationStatusEnum,
  automationRunStatusEnum,
} from './automations';
export {
  agents,
  agentRuns,
  agentStatusEnum,
  agentRunTriggerEnum,
  agentRunStatusEnum,
} from './agents';


