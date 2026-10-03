import { Component, input } from '@angular/core';
@Component({
  selector: 'app-page-header',
  template:
    '<header class="page-heading"><div><div class="eyebrow">{{ eyebrow() }}</div><h1>{{ title() }}</h1><p>{{ subtitle() }}</p></div><div class="heading-actions"><ng-content /></div></header>',
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly eyebrow = input('ΕΠΙΧΕΙΡΗΣΙΑΚΗ ΕΙΚΟΝΑ');
}
