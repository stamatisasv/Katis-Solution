import {
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { OperationsService } from '../../core/services/operations.service';
import { Icon } from '../../shared/components/icon';
import { APP_SETTINGS, NAV_GROUPS } from '../../core/services/app-settings';
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar.html',
  host: {
    '(window:resize)': 'updateViewport()',
    '[attr.inert]': 'mobile() && !open() ? \"\" : null',
  },
})
export class Sidebar {
  readonly mobile = signal(window.matchMedia('(max-width: 760px)').matches);
  readonly panel = viewChild<ElementRef<HTMLElement>>('sidebarPanel');

  constructor() {
    effect(() => {
      if (this.open() && this.mobile()) {
        this.panel()?.nativeElement.querySelector<HTMLElement>('.drawer-close')?.focus();
      }
    });
  }

  updateViewport(): void {
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    this.mobile.set(mobile);
    if (!mobile && this.open()) this.close.emit();
  }

  handleDrawerKeys(event: KeyboardEvent): void {
    if (!this.mobile() || !this.open()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    const targets = Array.from(
      this.panel()!.nativeElement.querySelectorAll<HTMLElement>('a,button'),
    );
    const first = targets[0];
    const last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  readonly ops = inject(OperationsService);
  readonly settings = APP_SETTINGS;
  readonly groups = NAV_GROUPS;
  readonly open = input(false);
  readonly collapsed = input(false);
  readonly close = output<void>();
  readonly hoverChange = output<boolean>();
  readonly focusChange = output<boolean>();

  handleFocusIn(event: FocusEvent): void {
    const target = event.target;
    this.focusChange.emit(target instanceof HTMLElement && target.matches(':focus-visible'));
  }

  handleFocusOut(event: FocusEvent): void {
    const sidebar = event.currentTarget as HTMLElement;
    if (!(event.relatedTarget instanceof Node) || !sidebar.contains(event.relatedTarget)) {
      this.focusChange.emit(false);
    }
  }
}
