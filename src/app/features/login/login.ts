import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { safeReturnUrl } from '../../core/services/auth.guard';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: ` <main class="login-page">
    <section class="panel login-card" aria-labelledby="login-title">
      <span class="login-brand">Katis Operations</span>
      <h1 id="login-title">Σύνδεση</h1>
      <p class="muted">Συνδεθείτε με τον λογαριασμό της επιχείρησης.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label for="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autocomplete="username"
          formControlName="email"
          required
        />
        <label for="login-password">Κωδικός πρόσβασης</label>
        <input
          id="login-password"
          type="password"
          autocomplete="current-password"
          formControlName="password"
          required
        />
        @if (error() || auth.error()) {
          <p class="error-text" role="alert">{{ error() || auth.error() }}</p>
        }
        <button class="button primary" type="submit" [disabled]="busy()">
          {{ busy() ? 'Σύνδεση…' : 'Σύνδεση' }}
        </button>
      </form>
      @if (auth.session()) {
        <button class="button secondary" type="button" [disabled]="busy()" (click)="retry()">
          Επανέλεγχος πρόσβασης
        </button>
        <button class="button secondary" type="button" [disabled]="busy()" (click)="logout()">
          Αποσύνδεση
        </button>
      }
    </section>
  </main>`,
  styles: `
    .login-page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #f4f6fa;
    }
    .login-card {
      width: min(100%, 420px);
      padding: 32px;
    }
    .login-brand {
      font-weight: 700;
      color: #267564;
    }
    h1 {
      margin: 20px 0 8px;
    }
    form {
      display: grid;
      gap: 12px;
      margin: 24px 0 16px;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .button {
      margin-top: 8px;
      justify-content: center;
    }
  `,
})
export class Login {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  constructor() {
    void this.auth.ready.then(() => {
      if (this.auth.signedIn()) void this.enter();
    });
  }
  private enter() {
    return this.router.navigateByUrl(
      safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
    );
  }
  async submit() {
    if (this.busy()) return;
    if (this.form.invalid) {
      this.error.set('Συμπληρώστε έγκυρο email και κωδικό.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email, password);
      this.form.controls.password.reset();
      await this.enter();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Η σύνδεση απέτυχε.');
    } finally {
      this.busy.set(false);
    }
  }
  async retry() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.loadProfile();
      if (this.auth.signedIn()) await this.enter();
    } catch {
      this.error.set('Ο έλεγχος πρόσβασης απέτυχε.');
    } finally {
      this.busy.set(false);
    }
  }
  async logout() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.signOut();
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
