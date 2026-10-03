import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OperationsService } from '../core/services/operations.service';
import { QuickCreateService } from '../core/services/quick-create.service';
import { PageHeader } from '../shared/components/page-header';
import { StatusBadge } from '../shared/components/status-badge';
import { Icon } from '../shared/components/icon';
@Component({
  selector: 'app-feature-preview',
  imports: [PageHeader, StatusBadge, Icon, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './feature-preview.html',
})
export class FeaturePreview {
  readonly route = inject(ActivatedRoute);
  readonly data = toSignal(this.route.data);
  readonly params = toSignal(this.route.paramMap);
  readonly ops = inject(OperationsService);
  readonly quick = inject(QuickCreateService);
  readonly title = computed(() => String(this.data()?.['title'] ?? ''));
  readonly feature = computed(() => String(this.data()?.['feature'] ?? ''));
  readonly delivery = computed(() =>
    this.ops.repository.deliveries().find((d) => d.id === this.params()?.get('id')),
  );
}
