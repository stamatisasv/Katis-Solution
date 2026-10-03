import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

const session = { user: { id: 'auth-admin', email: 'admin@example.com' } };
const profile = { id: 'profile-admin', user_id: 'auth-admin', name: 'Admin', role: 'admin' };

describe('Staff authentication', () => {
  let callback: (event: string, session: unknown) => void;
  let client: any;
  let router: any;
  beforeEach(() => {
    client = {
      auth: {
        onAuthStateChange: vi.fn((handler) => {
          callback = handler;
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { session }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: profile, error: null }) }),
        }),
      })),
    };
    router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client } },
        { provide: Router, useValue: router },
      ],
    });
  });
  it('restores a saved session and verifies its staff profile', async () => {
    client.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    const auth = TestBed.inject(AuthService);
    await auth.ready;
    expect(auth.signedIn()).toBe(true);
    expect(auth.profile()?.id).toBe('profile-admin');
  });
  it('signs in using the supplied credentials and clears state on logout', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.ready;
    await auth.signIn(' admin@example.com ', 'user-password');
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'user-password',
    });
    expect(auth.signedIn()).toBe(true);
    await auth.signOut();
    expect(auth.profile()).toBeNull();
    expect(auth.session()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
  it('blocks an Auth account without a linked staff profile', async () => {
    client.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }));
    const auth = TestBed.inject(AuthService);
    await auth.ready;
    await expect(auth.signIn('admin@example.com', 'user-password')).rejects.toThrow(
      'προφίλ προσωπικού',
    );
    expect(auth.signedIn()).toBe(false);
  });
  it('handles external logout and token refresh events', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.ready;
    await auth.signIn('admin@example.com', 'user-password');
    callback('TOKEN_REFRESHED', { ...session, access_token: 'refreshed' });
    expect(auth.signedIn()).toBe(true);
    callback('SIGNED_OUT', null);
    expect(auth.profile()).toBeNull();
    expect(auth.signedIn()).toBe(false);
  });
  it('does not turn invalid credentials into an active session', async () => {
    client.auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { status: 400 },
    });
    const auth = TestBed.inject(AuthService);
    await auth.ready;
    await expect(auth.signIn('admin@example.com', 'wrong')).rejects.toThrow('δεν είναι σωστός');
    expect(auth.session()).toBeNull();
  });
});
