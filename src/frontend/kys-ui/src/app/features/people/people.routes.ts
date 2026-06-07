import { Routes } from '@angular/router';

export const PEOPLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./people-list/people-list.component').then(m => m.PeopleListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./people-detail/people-detail.component').then(m => m.PeopleDetailComponent)
  }
];
