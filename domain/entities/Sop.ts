/**
 * Domain Entity — SOP & SOP Version
 *
 * Core Standard Operating Procedure entities. Framework-independent.
 */

export type SopStatus = 'draft' | 'review' | 'published' | 'archived';

export interface SopStep {
  readonly order: number;
  readonly instruction: string;
  readonly note?: string | null;
}

export interface Sop {
  readonly id: string;
  readonly title: string;
  readonly categoryId: string | null;
  readonly status: SopStatus;
  readonly ownerId: string;
  readonly currentVersionId: string | null;
  readonly reviewDueDate: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface SopVersion {
  readonly id: string;
  readonly sopId: string;
  readonly title: string;
  readonly steps: readonly SopStep[];
  readonly summary: string | null;
  readonly authorId: string;
  readonly createdAt: Date;
}

export interface CreateSopInput {
  readonly title: string;
  readonly categoryId?: string | null;
  readonly ownerId: string;
  readonly steps: readonly SopStep[];
  readonly summary?: string | null;
  readonly reviewDueDate?: Date | null;
  readonly status?: SopStatus;
}

export interface UpdateSopInput {
  readonly title?: string;
  readonly categoryId?: string | null;
  readonly steps?: readonly SopStep[];
  readonly status?: SopStatus;
  readonly ownerId?: string;
  readonly authorId: string;
  readonly versionSummary?: string;
  readonly reviewDueDate?: Date | null;
}
