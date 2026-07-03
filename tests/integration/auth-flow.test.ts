/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn } from '@/infrastructure/auth/auth-service';
import { createClient } from '@/infrastructure/supabase/server';

vi.mock('@/infrastructure/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Auth Flow Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
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
