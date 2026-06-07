import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { environment } from '../../../../environments/environment';

interface ResourceType {
  id: string;
  name: string;
  code: string;
  category: string | null;
  icon: string | null;
  description: string | null;
  isActive: boolean;
}

@Component({
  selector: 'app-resource-types',
  standalone: true,
  imports: [RouterLink, NgClass],
  template: `
    <div class="page-content">
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <a routerLink="/admin">Admin</a>
            <span>/</span>
            <span>Kaynak Tipleri</span>
          </div>
          <h1 class="page-title">Kaynak Tipleri</h1>
          <p class="page-subtitle">{{ types().length }} tip tanımlı</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">Yükleniyor...</div>
      } @else if (!types().length) {
        <div class="empty-state">
          <i class="pi pi-box"></i>
          <p>Kaynak tipi bulunamadı.</p>
        </div>
      } @else {
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Ad</th>
                <th>Kod</th>
                <th>Kategori</th>
                <th>Açıklama</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              @for (t of types(); track t.id) {
                <tr [class.inactive-row]="!t.isActive">
                  <td>
                    <div class="type-name-cell">
                      @if (t.icon) {
                        <i class="pi" [ngClass]="'pi-' + t.icon" style="color:#6B7280;font-size:0.875rem"></i>
                      }
                      <span class="type-name">{{ t.name }}</span>
                    </div>
                  </td>
                  <td><code class="type-code">{{ t.code }}</code></td>
                  <td class="text-muted">{{ t.category ?? '—' }}</td>
                  <td class="text-muted desc-cell">{{ t.description ?? '—' }}</td>
                  <td>
                    <span class="badge" [ngClass]="t.isActive ? 'badge--active' : 'badge--inactive'">
                      {{ t.isActive ? 'Aktif' : 'Pasif' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.25rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6B7280; margin-bottom: 0.25rem; a { color: #3B82F6; text-decoration: none; &:hover { text-decoration: underline; } } }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #111827; }
    .page-subtitle { font-size: 0.875rem; color: #6B7280; margin-top: 0.125rem; }
    .loading-state { text-align: center; padding: 4rem; color: #9CA3AF; }
    .empty-state { text-align: center; padding: 4rem; color: #9CA3AF; i { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; } }

    .table-card { background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    table { width: 100%; border-collapse: collapse; }
    th { background: #F9FAFB; padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #E5E7EB; }
    td { padding: 0.875rem 1rem; border-bottom: 1px solid #F3F4F6; font-size: 0.875rem; color: #374151; }
    tr:last-child td { border-bottom: none; }
    .inactive-row td { opacity: 0.55; }
    .type-name-cell { display: flex; align-items: center; gap: 0.5rem; }
    .type-name { font-weight: 500; color: #111827; }
    .type-code { background: #F3F4F6; color: #374151; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8125rem; }
    .text-muted { color: #9CA3AF; }
    .desc-cell { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badge { display: inline-flex; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .badge--active { background: #D1FAE5; color: #065F46; }
    .badge--inactive { background: #FEF3C7; color: #92400E; }
  `]
})
export class ResourceTypesComponent implements OnInit {
  private http = inject(HttpClient);

  types = signal<ResourceType[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.http.get<ResourceType[]>(`${environment.apiUrl}/resources/types?activeOnly=false`).subscribe({
      next: t => { this.types.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
