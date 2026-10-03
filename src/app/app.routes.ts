import { Routes } from '@angular/router';
import { NAV_GROUPS } from './core/services/app-settings';
const preview = () => import('./features/feature-preview').then((m) => m.FeaturePreview);
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Αρχική · Katis Operations',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'deliveries/:id',
        title: 'Λεπτομέρειες παράδοσης · Katis Operations',
        loadComponent: preview,
        data: { title: 'Λεπτομέρειες παράδοσης', feature: 'delivery-detail' },
      },
      ...NAV_GROUPS.flatMap((group) => group.items)
        .filter((item) => item.path !== 'dashboard')
        .map((item) => ({
          path: item.path,
          title: item.label + ' · Katis Operations',
          loadComponent: preview,
          data: { title: item.label, feature: item.path },
        })),
      {
        path: 'settings',
        title: 'Ρυθμίσεις · Katis Operations',
        loadComponent: preview,
        data: { title: 'Ρυθμίσεις', feature: 'settings' },
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
