/**
 * Domain Entity — Contact
 *
 * Core CRM contact entity type. Framework-independent.
 */

export type ContactStatus = 'active' | 'archived';
export type ContactSource = 'manual' | 'campus_marketplace';

export interface Contact {
  readonly id: string;
  readonly name: string;
  readonly organization: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly status: ContactStatus;
  readonly notes: string | null;
  readonly createdBy: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
  readonly source: ContactSource;
  readonly externalId: string | null;
  readonly syncedAt: Date | null;
  readonly metadata: Record<string, any> | null;
}

export interface CreateContactInput {
  readonly name: string;
  readonly organization?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly notes?: string | null;
  readonly createdBy?: string | null;
  readonly source?: ContactSource;
  readonly externalId?: string | null;
  readonly syncedAt?: Date | null;
  readonly metadata?: Record<string, any> | null;
}

export interface UpdateContactInput {
  readonly name?: string;
  readonly organization?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly status?: ContactStatus;
  readonly notes?: string | null;
  readonly source?: ContactSource;
  readonly externalId?: string | null;
  readonly syncedAt?: Date | null;
  readonly metadata?: Record<string, any> | null;
}

