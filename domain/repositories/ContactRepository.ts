/**
 * Domain Repository Interface — Contact
 *
 * Interface only — implementation in infrastructure layer.
 */

import type { Contact, CreateContactInput, UpdateContactInput } from '@/domain/entities';

export interface ContactRepository {
  findById(id: string): Promise<Contact | null>;
  findAll(options?: {
    search?: string;
    status?: string;
    includeDeleted?: boolean;
  }): Promise<Contact[]>;
  create(data: CreateContactInput): Promise<Contact>;
  update(id: string, data: Partial<UpdateContactInput>): Promise<Contact | null>;
  softDelete(id: string, deletedBy: string): Promise<void>;
  findDuplicates(
    email?: string | null,
    phone?: string | null,
    name?: string,
    organization?: string | null,
  ): Promise<Contact[]>;
}
