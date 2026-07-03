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
export { mediaAssets } from './media-assets';
export { contentMedia } from './content-media';
export { aiConversations } from './ai-conversations';


