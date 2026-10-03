import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard, safeReturnUrl } from './auth.guard';
import { vi } from 'vitest';

describe('Staff route protection', () => {
  it('redirects visitors to login with their original destination', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            ready: Promise.resolve(),
            session: () => null,
            profile: () => null,
            signedIn: () => false,
          },
        },
      ],
    });
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/deliveries/123' } as RouterStateSnapshot),
    );
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Fdeliveries%2F123',
    );
  });
  it('waits for profile verification before granting access', async () => {
    const auth = {
      ready: Promise.resolve(),
      session: () => ({}),
      profile: () => null,
      signedIn: () => true,
      loadProfile: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    expect(
      await TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, { url: '/tasks' } as RouterStateSnapshot),
      ),
    ).toBe(true);
    expect(auth.loadProfile).toHaveBeenCalledOnce();
  });
  it('keeps return navigation inside the app', () => {
    for (const url of [
      'https://example.com',
      '//example.com',
      '/\\example.com',
      '/login?returnUrl=/login',
      null,
    ])
      expect(safeReturnUrl(url)).toBe('/dashboard');
    expect(safeReturnUrl('/deliveries/123')).toBe('/deliveries/123');
  });
});
