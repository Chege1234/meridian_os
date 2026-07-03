/**
 * Domain Entity — Automation & AutomationRun
 *
 * Core rule-based automation models. Framework-independent.
 */

export type AutomationTriggerType = 'schedule' | 'event';

export interface AutomationTriggerConfig {
  readonly cron?: string;
  readonly event?: string;
}

export type AutomationActionType =
  | 'create_task'
  | 'send_notification'
  | 'update_status'
  | 'generate_content_draft'
  | 'run_report';

export interface AutomationActionConfig {
  readonly title?: string;
  readonly description?: string;
  readonly priority?: 'low' | 'medium' | 'high';
  readonly recipient?: string;
  readonly message?: string;
  readonly targetType?: 'campaign' | 'content_item' | 'sop' | 'task';
  readonly status?: string;
  readonly targetId?: string;
  readonly platform?: string;
  readonly type?: string;
  readonly body?: string;
  readonly caption?: string;
  readonly reportType?: string;
  readonly parameters?: Record<string, any>;
  readonly [key: string]: any;
}

export type AutomationStatus = 'active' | 'paused';

export interface Automation {
  readonly id: string;
  readonly name: string;
  readonly triggerType: AutomationTriggerType;
  readonly triggerConfig: AutomationTriggerConfig;
  readonly actionType: AutomationActionType;
  readonly actionConfig: AutomationActionConfig;
  readonly status: AutomationStatus;
  readonly requiresApproval: boolean;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export type AutomationRunStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'failed';

export interface AutomationRun {
  readonly id: string;
  readonly automationId: string;
  readonly triggeredAt: Date;
  readonly status: AutomationRunStatus;
  readonly inputSnapshot: Record<string, any>;
  readonly output: Record<string, any> | null;
  readonly error: string | null;
  readonly approvedBy: string | null;
  readonly executedAt: Date | null;
}

export interface CreateAutomationInput {
  readonly name: string;
  readonly triggerType: AutomationTriggerType;
  readonly triggerConfig: AutomationTriggerConfig;
  readonly actionType: AutomationActionType;
  readonly actionConfig: AutomationActionConfig;
  readonly status?: AutomationStatus;
  readonly requiresApproval?: boolean;
  readonly createdBy: string;
}

export interface UpdateAutomationInput {
  readonly name?: string;
  readonly triggerType?: AutomationTriggerType;
  readonly triggerConfig?: AutomationTriggerConfig;
  readonly actionType?: AutomationActionType;
  readonly actionConfig?: AutomationActionConfig;
  readonly status?: AutomationStatus;
  readonly requiresApproval?: boolean;
}

export interface CreateAutomationRunInput {
  readonly automationId: string;
  readonly status?: AutomationRunStatus;
  readonly inputSnapshot: Record<string, any>;
  readonly approvedBy?: string | null;
}
