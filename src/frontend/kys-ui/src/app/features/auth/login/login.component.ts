import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { login } from '../../../core/store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../core/store/auth/auth.selectors';
import { BrandingService } from '../../../core/services/branding.service';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, TranslocoModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-card__header">
          @if (branding.logoUrl(); as logo) {
            <img [src]="logo" alt="logo" class="login-card__logo-img" />
          } @else {
            <div class="login-card__logo">{{ branding.branding()?.shortName || 'KYS' }}</div>
          }
          <h1>{{ branding.branding()?.shortName || branding.companyName() }}</h1>
          <p>{{ 'app.tagline' | transloco }}</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-card__form">
          @if (error$ | async; as error) {
            <div class="login-card__error">
              <i class="pi pi-exclamation-triangle"></i>
              {{ error }}
            </div>
          }

          <div class="form-group">
            <label for="email">{{ 'login.email' | transloco }}</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              [placeholder]="'login.emailPlaceholder' | transloco"
              [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched" />
            @if (form.get('email')?.errors?.['required'] && form.get('email')?.touched) {
              <span class="form-error">{{ 'login.emailRequired' | transloco }}</span>
            }
            @if (form.get('email')?.errors?.['email'] && form.get('email')?.touched) {
              <span class="form-error">{{ 'login.emailInvalid' | transloco }}</span>
            }
          </div>

          <div class="form-group">
            <label for="password">{{ 'login.password' | transloco }}</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              [class.is-invalid]="form.get('password')?.invalid && form.get('password')?.touched" />
            @if (form.get('password')?.errors?.['required'] && form.get('password')?.touched) {
              <span class="form-error">{{ 'login.passwordRequired' | transloco }}</span>
            }
          </div>

          <button type="submit" [disabled]="(loading$ | async) || form.invalid" class="btn-primary">
            @if (loading$ | async) {
              <i class="pi pi-spin pi-spinner"></i> {{ 'login.signingIn' | transloco }}
            } @else {
              {{ 'login.submit' | transloco }}
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--text-strong) 0%, var(--text) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .login-card {
      background: var(--surface);
      border-radius: 1rem;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .login-card__header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .login-card__logo-img { max-height: 64px; max-width: 220px; object-fit: contain; margin-bottom: 0.5rem; }
    .login-card__logo {
      display: inline-flex;
      background: var(--primary);
      color: white;
      font-weight: 700;
      font-size: 1.25rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-strong);
      margin-bottom: 0.25rem;
    }
    p {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .login-card__error {
      background: var(--danger-soft-bg);
      color: var(--danger-soft-text);
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .login-card__form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text);
      }

      input {
        border: 1px solid var(--border-strong);
        border-radius: 0.5rem;
        padding: 0.625rem 0.875rem;
        font-size: 0.875rem;
        outline: none;
        transition: border-color 150ms;

        &:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        &.is-invalid { border-color: var(--danger); }
      }
    }
    .form-error {
      font-size: 0.75rem;
      color: var(--danger);
    }
    .btn-primary {
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 0.5rem;
      padding: 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      &:hover:not(:disabled) { background: var(--primary-hover); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `]
})
export class LoginComponent {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  protected branding = inject(BrandingService);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.valid) {
      const { email, password } = this.form.value;
      this.store.dispatch(login({ email, password }));
    }
  }
}
