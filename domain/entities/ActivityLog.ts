/**
 * Domain Entity — Activity Log
 *
 * Immutable audit record. Per BR-1200/1201: cannot be edited or deleted.
 * Framework-independent.
 */

export interface ActivityLog {
  readonly id: string;
  readonly userId: string | null;
  readonly action: string;
  readonly module: string;
  readonly entity: string | null;
  readonly entityId: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly ipAddress: string | null;
  readonly createdAt: Date;
}

export interface CreateActivityLogInput {
  readonly userId: string | null;
  readonly action: string;
  readonly module: string;
  readonly entity?: string;
  readonly entityId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly ipAddress?: string;
}
