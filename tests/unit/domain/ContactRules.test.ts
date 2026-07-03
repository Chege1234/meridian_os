import { describe, it, expect } from 'vitest';
import { detectDuplicates } from '@/domain/rules/ContactRules';
import type { Contact } from '@/domain/entities';

describe('ContactRules — detectDuplicates', () => {
  const mockContacts: Contact[] = [
    {
      id: 'contact-1',
      name: 'Alice Smith',
      organization: 'ACME Corp',
      email: 'alice@acme.com',
      phone: '+1 (555) 111-2222',
      status: 'active',
      notes: null,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
    },
    {
      id: 'contact-2',
      name: 'Bob Jones',
      organization: 'Globex',
      email: 'bob@globex.com',
      phone: '+1 (555) 333-4444',
      status: 'active',
      notes: null,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
    },
  ];

  it('should detect duplicate by exact email', () => {
    const input = {
      name: 'Alice S.',
      email: 'alice@acme.com',
    };
    const result = detectDuplicates(input, mockContacts);
    expect(result.hasDuplicates).toBe(true);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates?.[0]?.id).toBe('contact-1');
  });

  it('should detect duplicate by exact phone (ignoring formatting)', () => {
    const input = {
      name: 'Alice S.',
      phone: '1-555-111-2222',
    };
    const result = detectDuplicates(input, mockContacts);
    expect(result.hasDuplicates).toBe(true);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates?.[0]?.id).toBe('contact-1');
  });

  it('should detect duplicate by name + organization combination', () => {
    const input = {
      name: 'Alice Smith',
      organization: 'ACME Corp',
    };
    const result = detectDuplicates(input, mockContacts);
    expect(result.hasDuplicates).toBe(true);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates?.[0]?.id).toBe('contact-1');
  });

  it('should NOT detect duplicate if organization differs', () => {
    const input = {
      name: 'Alice Smith',
      organization: 'Different Inc',
    };
    const result = detectDuplicates(input, mockContacts);
    expect(result.hasDuplicates).toBe(false);
  });

  it('should NOT detect duplicate if details do not match', () => {
    const input = {
      name: 'Charlie Brown',
      email: 'charlie@brown.com',
    };
    const result = detectDuplicates(input, mockContacts);
    expect(result.hasDuplicates).toBe(false);
  });
});
