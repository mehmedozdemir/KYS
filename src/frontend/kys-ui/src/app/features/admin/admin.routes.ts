import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'shared-resources',
    loadComponent: () => import('./shared-resources/shared-resources.component').then(m => m.SharedResourcesComponent)
  },
  {
    path: 'resource-types',
    loadComponent: () => import('./resource-types/resource-types.component').then(m => m.ResourceTypesComponent)
  }
];
