import { Component, computed, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/components/icon';
import { OperationsService } from '../../core/services/operations.service';
@Component({
  selector: 'app-topbar',
  imports: [Icon, RouterLink],
  templateUrl: './topbar.html',
  host: { '(document:keydown.escape)': 'dismiss()' },
})
export class Topbar {
  readonly menu = output<void>();
  readonly create = output<'task' | 'note'>();
  readonly ops = inject(OperationsService);
  readonly query = signal('');
  readonly results = computed(() => this.ops.search(this.query()));
  readonly notifications = signal(false);
  readonly newMenu = signal(false);
  readonly profile = signal(false);
  searchValue(event: Event) {
    return (event.target as HTMLInputElement).value;
  }
  dismiss() {
    this.notifications.set(false);
    this.newMenu.set(false);
    this.profile.set(false);
    this.query.set('');
  }
}
