import { Routes } from '@angular/router';

export const KB_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./kb-list/kb-list.component').then(m => m.KbListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./kb-editor/kb-editor.component').then(m => m.KbEditorComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./kb-detail/kb-detail.component').then(m => m.KbDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./kb-editor/kb-editor.component').then(m => m.KbEditorComponent)
  }
];
