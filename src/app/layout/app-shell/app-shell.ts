import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { QuickCreate } from '../../shared/components/quick-create';
import { QuickCreateService } from '../../core/services/quick-create.service';
import { inject } from '@angular/core';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar, QuickCreate],
  template: `<div class="app-shell" [class.sidebar-collapsed]="collapsed()">
    <a class="skip-link" href="#workspace">Μετάβαση στο περιεχόμενο</a
    ><app-sidebar
      [open]="drawer()"
      [collapsed]="collapsed()"
      (close)="closeDrawer()"
      (hoverChange)="sidebarHovered.set($event)"
      (focusChange)="sidebarFocused.set($event)"
    />
    @if (drawer()) {
      <button
        class="drawer-backdrop"
        aria-label="Κλείσιμο πλοήγησης"
        (click)="closeDrawer()"
      ></button>
    }
    <div class="workspace" [attr.inert]="drawer() ? '' : null">
      <app-topbar (menu)="drawer.set(true)" (create)="quick.open($event)" />
      <main id="workspace" tabindex="-1"><router-outlet /></main>
      <footer class="workspace-footer">
        <span
          >Katis Operations <span class="footer-separator">/</span> Business Management System</span
        ><span>Πρωτότυπο UI · Οκτώβριος 2026</span>
      </footer>
    </div>
    @if (quick.kind(); as kind) {
      <app-quick-create [kind]="kind" (closed)="quick.close()" (saved)="toast.set($event)" />
    }
    @if (toast()) {
      <div class="toast" role="status">
        {{ toast() }}<button aria-label="Κλείσιμο μηνύματος" (click)="toast.set('')">×</button>
      </div>
    }
  </div>`,
})
export class AppShell {
  closeDrawer(): void {
    this.drawer.set(false);
    document.querySelector<HTMLElement>('.mobile-menu')?.focus();
  }

  readonly drawer = signal(false);
  readonly sidebarHovered = signal(false);
  readonly sidebarFocused = signal(false);
  readonly collapsed = computed(() => !this.sidebarHovered() && !this.sidebarFocused());
  readonly toast = signal('');
  readonly quick = inject(QuickCreateService);
}
