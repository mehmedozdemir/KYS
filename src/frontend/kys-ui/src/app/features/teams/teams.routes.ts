import { Routes } from '@angular/router';

export const TEAMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./team-list/team-list.component').then(m => m.TeamListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./team-detail/team-detail.component').then(m => m.TeamDetailComponent)
  }
];
