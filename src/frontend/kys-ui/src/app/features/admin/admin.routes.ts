import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'custom-fields',
    loadComponent: () => import('./custom-fields/custom-fields.component').then(m => m.CustomFieldsComponent)
  },
  {
    path: 'environment-types',
    loadComponent: () => import('./environment-types/environment-types.component').then(m => m.EnvironmentTypesComponent)
  },
  {
    path: 'hosting-platforms',
    loadComponent: () => import('./hosting-platforms/hosting-platforms.component').then(m => m.HostingPlatformsComponent)
  },
  {
    path: 'platform-users',
    loadComponent: () => import('./platform-users/platform-users.component').then(m => m.PlatformUsersComponent)
  },
  {
    path: 'audit-log',
    loadComponent: () => import('./audit-log/audit-log.component').then(m => m.AuditLogComponent)
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
