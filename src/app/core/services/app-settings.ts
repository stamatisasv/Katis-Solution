export const APP_SETTINGS = {
  name: 'Katis Operations',
  subtitle: 'Business Management System',
  company: 'Κατής Δημήτριος & Σία Ο.Ε.',
  location: 'Λιβαδοχώρι, Λήμνος',
} as const;
export const NAV_GROUPS = [
  {
    label: 'ΚΑΘΗΜΕΡΙΝΗ ΛΕΙΤΟΥΡΓΙΑ',
    items: [
      { path: 'dashboard', label: 'Αρχική', icon: 'grid' },
      { path: 'tasks', label: 'Εργασίες', icon: 'check' },
      { path: 'calendar', label: 'Ημερολόγιο', icon: 'calendar' },
      { path: 'deliveries', label: 'Παραδόσεις', icon: 'truck' },
    ],
  },
  {
    label: 'ΕΜΠΟΡΙΚΗ ΔΙΑΧΕΙΡΙΣΗ',
    items: [
      { path: 'inventory', label: 'Προϊόντα & απόθεμα', icon: 'box' },
      { path: 'stock-movements', label: 'Κινήσεις αποθέματος', icon: 'arrows' },
      { path: 'customers', label: 'Πελάτες', icon: 'users' },
      { path: 'suppliers', label: 'Προμηθευτές', icon: 'building' },
      { path: 'finance', label: 'Οικονομικά', icon: 'wallet' },
    ],
  },
  {
    label: 'ΟΡΓΑΝΩΣΗ',
    items: [
      { path: 'notes', label: 'Σημειώσεις', icon: 'note' },
      { path: 'documents', label: 'Έγγραφα', icon: 'file' },
      { path: 'activity', label: 'Ιστορικό', icon: 'history' },
    ],
  },
];
