import { AthensDatePipe } from '../../shared/components/athens-date.pipe';
import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OperationsService } from '../../core/services/operations.service';
import { QuickCreateService } from '../../core/services/quick-create.service';
import { PageHeader } from '../../shared/components/page-header';
import { StatCard } from '../../shared/components/stat-card';
import { Icon } from '../../shared/components/icon';
import { StatusBadge } from '../../shared/components/status-badge';
@Component({
  selector: 'app-dashboard',
  imports: [AthensDatePipe, DatePipe, RouterLink, PageHeader, StatCard, Icon, StatusBadge],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly auth = inject(AuthService);
  readonly ops = inject(OperationsService);
  readonly quick = inject(QuickCreateService);
  readonly newMenu = signal(false);
  readonly error = signal('');
  readonly busyTask = signal<string | null>(null);
  async complete(id: string) {
    this.busyTask.set(id);
    try {
      await this.ops.repository.completeTask(id);
    } catch {
      this.error.set('Η ενημέρωση της εργασίας απέτυχε.');
    } finally {
      this.busyTask.set(null);
    }
  }
  eventIcon(type: string) {
    return type === 'delivery' ? 'truck' : type === 'supplier' ? 'box' : 'building';
  }
}
