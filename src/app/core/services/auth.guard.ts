import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  if (auth.session() && !auth.profile()) await auth.loadProfile();
  return (
    auth.signedIn() || router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
  );
};

export function safeReturnUrl(value: string | null): string {
  return value?.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !value.split('?')[0].startsWith('/login')
    ? value
    : '/dashboard';
}
