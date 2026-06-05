import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { selectCurrentUser } from '../../core/store/auth/auth.selectors';
import { logout } from '../../core/store/auth/auth.actions';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  template: `
    <header class="topbar">
      <div class="topbar__search">
        <i class="pi pi-search"></i>
        <input
          type="text"
          placeholder="Ara... (müşteri, ürün, kişi)"
          [(ngModel)]="searchQuery"
          (keyup.enter)="onSearch()" />
      </div>

      <div class="topbar__right">
        @if (user$ | async; as user) {
          <span class="topbar__user">{{ user.fullName }}</span>
        }
        <button class="topbar__logout" (click)="onLogout()">
          <i class="pi pi-sign-out"></i>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 64px;
      background: white;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      flex-shrink: 0;
    }
    .topbar__search {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #F3F4F6;
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      width: 400px;

      i { color: #9CA3AF; font-size: 0.875rem; }

      input {
        background: transparent;
        border: none;
        outline: none;
        font-size: 0.875rem;
        color: #374151;
        width: 100%;
        &::placeholder { color: #9CA3AF; }
      }
    }
    .topbar__right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .topbar__user {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }
    .topbar__logout {
      background: none;
      border: none;
      cursor: pointer;
      color: #6B7280;
      font-size: 1rem;
      padding: 0.25rem;
      border-radius: 0.25rem;
      &:hover { color: #EF4444; }
    }
  `]
})
export class TopbarComponent {
  private store = inject(Store);
  private router = inject(Router);

  user$ = this.store.select(selectCurrentUser);
  searchQuery = '';

  onSearch(): void {
    if (this.searchQuery.trim().length >= 2) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  onLogout(): void {
    this.store.dispatch(logout());
  }
}
