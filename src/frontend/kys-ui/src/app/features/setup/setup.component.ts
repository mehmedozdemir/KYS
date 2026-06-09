import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SetupService } from '../../core/services/setup.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="setup-page">
      <div class="setup-card">
        <div class="setup-header">
          <div class="setup-logo">
            <span class="logo-icon">⚙</span>
            <span class="logo-text">KYS</span>
          </div>
          <h1>İlk Kurulum</h1>
          <p>Sistemi kullanmaya başlamak için bir yönetici hesabı oluşturun.</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="setup-form" novalidate>

          <div class="form-row">
            <div class="form-group" [class.error]="isInvalid('firstName')">
              <label for="firstName">Ad</label>
              <input id="firstName" formControlName="firstName" placeholder="Adınız" autocomplete="given-name" />
              <span class="error-msg" *ngIf="isInvalid('firstName')">Ad zorunludur.</span>
            </div>
            <div class="form-group" [class.error]="isInvalid('lastName')">
              <label for="lastName">Soyad</label>
              <input id="lastName" formControlName="lastName" placeholder="Soyadınız" autocomplete="family-name" />
              <span class="error-msg" *ngIf="isInvalid('lastName')">Soyad zorunludur.</span>
            </div>
          </div>

          <div class="form-group" [class.error]="isInvalid('email')">
            <label for="email">E-posta</label>
            <input id="email" type="email" formControlName="email" placeholder="ad@sirket.com" autocomplete="email" />
            <span class="error-msg" *ngIf="isInvalid('email')">Geçerli bir e-posta giriniz.</span>
          </div>

          <div class="form-group" [class.error]="isInvalid('password')">
            <label for="password">Şifre</label>
            <input id="password" type="password" formControlName="password"
              placeholder="En az 8 karakter, büyük harf ve rakam içermeli" autocomplete="new-password" />
            <span class="error-msg" *ngIf="isInvalid('password')">
              Şifre en az 8 karakter, bir büyük harf ve bir rakam içermelidir.
            </span>
          </div>

          <div class="form-group" [class.error]="isInvalid('confirmPassword') || passwordMismatch">
            <label for="confirmPassword">Şifre Tekrar</label>
            <input id="confirmPassword" type="password" formControlName="confirmPassword"
              placeholder="Şifreyi tekrar girin" autocomplete="new-password" />
            <span class="error-msg" *ngIf="passwordMismatch">Şifreler eşleşmiyor.</span>
          </div>

          <div class="alert-error" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button type="submit" class="btn-submit" [disabled]="loading">
            <span *ngIf="!loading">Hesap Oluştur ve Başla</span>
            <span *ngIf="loading">Oluşturuluyor...</span>
          </button>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .setup-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .setup-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }

    .setup-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .setup-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .logo-icon {
      font-size: 1.75rem;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 800;
      color: #f1f5f9;
      letter-spacing: 0.1em;
    }

    .setup-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.5rem;
    }

    .setup-header p {
      color: #94a3b8;
      font-size: 0.875rem;
      margin: 0;
    }

    .setup-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--border-strong);
    }

    input {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 0.625rem 0.875rem;
      color: #f1f5f9;
      font-size: 0.9375rem;
      transition: border-color 0.15s;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }

    input::placeholder {
      color: #475569;
    }

    input:focus {
      border-color: var(--indigo);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
    }

    .form-group.error input {
      border-color: var(--danger);
    }

    .error-msg {
      font-size: 0.75rem;
      color: var(--danger);
    }

    .alert-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: var(--danger-soft-text);
      font-size: 0.875rem;
    }

    .btn-submit {
      background: var(--indigo);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
      margin-top: 0.5rem;
    }

    .btn-submit:hover:not(:disabled) {
      background: var(--indigo-strong);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class SetupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly setupService = inject(SetupService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    password: ['', [Validators.required, Validators.minLength(8),
      Validators.pattern('(?=.*[A-Z])(?=.*[0-9]).{8,}')]],
    confirmPassword: ['', Validators.required]
  });

  get passwordMismatch(): boolean {
    const { password, confirmPassword } = this.form.value;
    return !!(confirmPassword && password !== confirmPassword && this.form.get('confirmPassword')?.touched);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.passwordMismatch) return;

    this.loading = true;
    this.errorMessage = '';

    const { firstName, lastName, email, password } = this.form.value;

    this.setupService.initialize({
      firstName: firstName!,
      lastName: lastName!,
      email: email!,
      password: password!
    }).subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: (err) => {
        this.loading = false;
        if (err.status === 409) {
          this.errorMessage = 'Sistem zaten başlatılmış. Giriş sayfasına yönlendiriliyorsunuz...';
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        } else if (err.status === 422) {
          const errors = err.error?.extensions?.errors;
          this.errorMessage = errors
            ? Object.values(errors).flat().join(' ')
            : 'Girilen bilgiler geçersiz.';
        } else {
          this.errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.';
        }
      }
    });
  }
}
