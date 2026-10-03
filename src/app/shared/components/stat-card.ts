import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';
@Component({
  selector: 'app-stat-card',
  imports: [Icon, RouterLink],
  template:
    '<a class="stat-card" [routerLink]="link()"><div class="stat-top"><span>{{ label() }}</span><app-icon [name]="icon()" /></div><div class="stat-value">{{ value() }}<span>{{ unit() }}</span></div><div class="stat-foot"><span [class]="tone()">{{ detail() }}</span><app-icon name="arrow" /></div></a>',
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly unit = input('');
  readonly detail = input('');
  readonly icon = input('box');
  readonly link = input('/dashboard');
  readonly tone = input('muted');
}
