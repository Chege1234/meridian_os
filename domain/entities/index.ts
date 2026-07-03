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

