import { Routes } from '@angular/router';

export const KB_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./kb-list/kb-list.component').then(m => m.KbListComponent)
  }
];
