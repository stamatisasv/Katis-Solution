import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/entities';

export interface StaffProfile extends Profile {
  user_id: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client = inject(SupabaseService).client;
  private readonly router = inject(Router);
  readonly session = signal<Session | null>(null);
  readonly profile = signal<StaffProfile | null>(null);
  readonly error = signal('');
  readonly signedIn = computed(() => !!this.session() && !!this.profile());
  readonly name = computed(() => this.profile()?.name ?? this.session()?.user.email ?? '');
  private generation = 0;
  readonly ready: Promise<void>;

  constructor() {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      // Keep network work outside the Auth callback and discard stale profile responses.
      const previous = this.session()?.user.id;
      this.session.set(session);
      if (previous !== session?.user.id || !session) {
        this.profile.set(null);
        this.generation++;
      }
      if (!session && _event === 'SIGNED_OUT') {
        void this.router.navigate(['/login']);
      } else if (session && !this.profile()) {
        setTimeout(() => {
          void this.loadProfile(session).catch(() =>
            this.error.set('Η φόρτωση προφίλ απέτυχε. Δοκιμάστε ξανά.'),
          );
        }, 0);
      }
    });
    inject(DestroyRef).onDestroy(() => data.subscription.unsubscribe());
    this.ready = this.restore();
  }

  private async restore() {
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) throw error;
      this.session.set(data.session);
      if (data.session) await this.loadProfile(data.session);
    } catch {
      this.error.set('Η επαναφορά της σύνδεσης απέτυχε. Συνδεθείτε ξανά.');
    }
  }

  async loadProfile(session = this.session()) {
    if (!session) return;
    const generation = this.generation;
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (generation !== this.generation || this.session()?.user.id !== session.user.id) return;
      this.profile.set(error ? null : (data as StaffProfile | null));
      this.error.set(
        error
          ? 'Δεν ήταν δυνατή η φόρτωση του προφίλ. Δοκιμάστε ξανά.'
          : data
            ? ''
            : 'Ο λογαριασμός δεν έχει συνδεθεί με προφίλ προσωπικού. Επικοινωνήστε με τον διαχειριστή.',
      );
    } catch {
      if (generation !== this.generation || this.session()?.user.id !== session.user.id) return;
      this.profile.set(null);
      this.error.set('Δεν ήταν δυνατή η φόρτωση του προφίλ. Δοκιμάστε ξανά.');
    }
  }

  async signIn(email: string, password: string) {
    await this.ready;
    this.error.set('');
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error)
      throw new Error(
        error.status === 400
          ? 'Το email ή ο κωδικός δεν είναι σωστός.'
          : 'Η σύνδεση απέτυχε. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.',
      );
    this.session.set(data.session);
    await this.loadProfile(data.session);
    if (!this.profile()) throw new Error(this.error());
  }

  async signOut() {
    const { error } = await this.client.auth.signOut({ scope: 'local' });
    if (error) throw new Error('Η αποσύνδεση απέτυχε. Δοκιμάστε ξανά.');
    this.generation++;
    this.session.set(null);
    this.profile.set(null);
    await this.router.navigate(['/login']);
  }
}
