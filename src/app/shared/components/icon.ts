import { Component, input } from '@angular/core';
const paths: Record<string, string> = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  check: 'M9 5H5v16h14V5h-4 M9 3h6v4H9z M8 13l3 3 5-6',
  calendar: 'M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18 M7 14h2 M13 14h2 M7 18h2',
  truck: 'M3 6h12v12H3z M15 10h4l3 4v4h-7 M7 18a2 2 0 1 0 0 .1 M18 18a2 2 0 1 0 0 .1',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10 M7 5l10 4',
  arrows: 'M4 7h16l-4-4 M20 17H4l4 4',
  users:
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-3a7 7 0 0 1 14 0v3 M17 4a4 4 0 0 1 0 7 M19 15a5 5 0 0 1 3 6',
  building: 'M4 21V3h12v18 M16 10h5v11 M2 21h20 M8 7h4 M8 11h4 M8 15h4 M8 21v-3h4v3',
  wallet: 'M3 5h17v15H3z M3 9h17 M16 12h5v5h-5z',
  note: 'M4 3h16v14l-4 4H4z M8 8h8 M8 12h8 M8 16h4 M16 21v-4h4',
  file: 'M5 3h9l5 5v13H5z M14 3v6h5 M9 13h6 M9 17h6',
  history: 'M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v5l3 2',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
  bell: 'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4',
  plus: 'M12 5v14 M5 12h14',
  chevron: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  close: 'M6 6l12 12 M18 6L6 18',
  pin: 'M8 3h8l-1 6 4 4H5l4-4z M12 13v8',
  warning: 'M12 3l10 18H2z M12 9v5 M12 17v1',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  arrow: 'M4 12h16 M15 7l5 5-5 5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M12 1v2 M12 21v2 M1 12h2 M21 12h2 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2',
};
@Component({
  selector: 'app-icon',
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path" /></svg>',
  styles: [
    ':host{display:inline-flex;width:20px;height:20px;flex-shrink:0}svg{width:100%;height:100%}',
  ],
})
export class Icon {
  readonly name = input('grid');
  get path() {
    return paths[this.name()] ?? paths['box'];
  }
}
