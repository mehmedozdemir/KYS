import { Routes } from '@angular/router';

export const ENVIRONMENTS_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () => import('./environment-detail/environment-detail.component').then(m => m.EnvironmentDetailComponent)
  }
];
