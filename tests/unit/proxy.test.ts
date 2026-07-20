import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxy } from '../../proxy';
import { createServerClient } from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('Proxy Middleware', () => {
  let mockSupabase: any;
  let mockGetUser: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser = vi.fn();
    mockSupabase = {
      auth: {
        getUser: mockGetUser,
      },
    };
    vi.mocked(createServerClient).mockReturnValue(mockSupabase);
  });

  const createMockRequest = (pathname: string): any => {
    const url = new URL(`http://localhost:3000${pathname}`);
    return {
      nextUrl: url,
      url: url.toString(),
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
      },
    };
  };

  it('should allow public routes (/login) to bypass auth', async () => {
    const req = createMockRequest('/login');
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res.headers?.get('location')).toBeNull();
  });

  it('should allow public routes (/signup) to bypass auth', async () => {
    const req = createMockRequest('/signup');
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res.headers?.get('location')).toBeNull();
  });

  it('should allow cron route (/api/cron) to bypass auth', async () => {
    const req = createMockRequest('/api/cron');
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res.headers?.get('location')).toBeNull();
  });

  it('should redirect unauthenticated users to /login for protected routes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('No user found'),
    });

    const req = createMockRequest('/dashboard');
    const res: any = await proxy(req);
    
    expect(res).toBeDefined();
    expect(res.headers?.get('location')).toContain('/login');
  });

  it('should allow authenticated users to access protected routes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const req = createMockRequest('/dashboard');
    const res = await proxy(req);
    
    expect(res).toBeDefined();
    expect(res.headers?.get('location')).toBeNull();
  });
});
