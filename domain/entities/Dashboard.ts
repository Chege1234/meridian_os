/**
 * Domain Entity — Dashboard
 *
 * Core Dashboard configurations. Framework-independent.
 */

export type WidgetType = 'campaign_performance' | 'content_funnel' | 'crm_summary' | 'ai_cost';

export interface DashboardWidget {
  readonly id: string;
  readonly type: WidgetType;
  readonly title: string;
  readonly position: number;
  readonly filters: Record<string, any>;
}

export interface Dashboard {
  readonly id: string;
  readonly name: string;
  readonly ownerId: string;
  readonly layout: DashboardWidget[];
  readonly isShared: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface CreateDashboardInput {
  readonly name: string;
  readonly ownerId: string;
  readonly layout?: DashboardWidget[];
  readonly isShared?: boolean;
}

export interface UpdateDashboardInput {
  readonly name?: string;
  readonly layout?: DashboardWidget[];
  readonly isShared?: boolean;
}
