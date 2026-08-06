import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/infrastructure/supabase/server';

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
};

vi.mock('@/infrastructure/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { signIn } from '@/infrastructure/auth/auth-service';

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (createClient as any).mockImplementation(async () => mockSupabase);

    mockSupabase.auth.signInWithPassword.mockReset();
    mockSupabase.auth.signOut.mockReset();
    mockSupabase.auth.getSession.mockReset();
    mockSupabase.auth.getUser.mockReset();
    mockSupabase.from.mockReset();
    mockSupabase.select.mockReset();
    mockSupabase.update.mockReset();
    mockSupabase.insert.mockReset();
    mockSupabase.eq.mockReset();
    mockSupabase.single.mockReset();

    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });
  });

  it('should successfully sign in active user and write audit logs', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'active@company.com' } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: { status: 'active' },
      error: null,
    });

    const result = await signIn('active@company.com', 'password123');

    expect(result.success).toBe(true);
    expect(result.userId).toBe('user-123');

    // Verify status was checked
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');

    // Verify last login was updated
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_login: expect.any(String) }),
    );

    // Verify audit log was recorded (BR-005)
    expect(mockSupabase.from).toHaveBeenCalledWith('activity_logs');
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        action: 'login',
        module: 'auth',
      }),
    );
  });

  it('should reject suspended user and sign them out immediately', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'suspended-123', email: 'suspended@company.com' } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: { status: 'suspended' },
      error: null,
    });

    const result = await signIn('suspended@company.com', 'password123');

    expect(result.success).toBe(false);
    expect(result.error).toContain('account has been suspended');
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('should reject archived user and sign them out immediately', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'archived-123', email: 'archived@company.com' } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: { status: 'archived' },
      error: null,
    });

    const result = await signIn('archived@company.com', 'password123');

    expect(result.success).toBe(false);
    expect(result.error).toContain('account has been archived');
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});
