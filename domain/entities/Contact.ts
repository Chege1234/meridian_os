/**
 * Domain Entity — Contact
 *
 * Core CRM contact entity type. Framework-independent.
 */

export type ContactStatus = 'active' | 'archived';

export interface Contact {
  readonly id: string;
  readonly name: string;
  readonly organization: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly status: ContactStatus;
  readonly notes: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
}

export interface CreateContactInput {
  readonly name: string;
  readonly organization?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly notes?: string | null;
  readonly createdBy: string;
}

export interface UpdateContactInput {
  readonly name?: string;
  readonly organization?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly status?: ContactStatus;
  readonly notes?: string | null;
}
