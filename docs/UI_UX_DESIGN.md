# UI_UX_DESIGN.md — KYS Platform Arayüz Tasarım Kılavuzu

---

## Tasarım Felsefesi

KYS, yazılımcıların ve müdürlerin **günlük olarak** kullandığı bir araç.
Hedef: Bilgiye **hızlı**, **güvenli** ve **hatasız** ulaşmak.

**Ton:** Kurumsal ama soğuk değil. Profesyonel ama sıkıcı değil.
Bilgi yoğun ekranlarda **netlik**, aksiyonlarda **güven**.

---

## Design System

### Renk Paleti

```scss
// Ana renkler
--color-primary-900: #0F172A;   // Koyu lacivert (sidebar bg)
--color-primary-800: #1E293B;   // Sidebar item hover
--color-primary-700: #334155;   // Border, divider
--color-primary-500: #3B82F6;   // Primary action (button, link)
--color-primary-400: #60A5FA;   // Hover state
--color-primary-100: #DBEAFE;   // Light accent bg

// Nötr
--color-surface-0:   #FFFFFF;   // Kart, modal bg
--color-surface-50:  #F8FAFC;   // Sayfa bg
--color-surface-100: #F1F5F9;   // Input bg
--color-surface-200: #E2E8F0;   // Border
--color-surface-500: #64748B;   // Placeholder, meta text
--color-surface-700: #334155;   // Body text
--color-surface-900: #0F172A;   // Heading text

// Semantik
--color-success:  #10B981;   // Aktif, başarılı
--color-warning:  #F59E0B;   // Uyarı, dikkat
--color-danger:   #EF4444;   // Hata, silme, prod ortamı
--color-info:     #3B82F6;   // Bilgi
--color-neutral:  #94A3B8;   // Pasif, kullanılmıyor

// Environment renkleri (sabit)
--env-dev:   #8B5CF6;   // Mor - Development
--env-test:  #F59E0B;   // Sarı - Test
--env-uat:   #3B82F6;   // Mavi - UAT
--env-prod:  #EF4444;   // Kırmızı - Production (dikkat!)

// Customer status renkleri
--status-onboarding: #F59E0B;
--status-active:     #10B981;
--status-inactive:   #94A3B8;
--status-churned:    #EF4444;
```

### Typography

```scss
// Font: Inter (değil!) → Geist Sans (kurumsal, net)
// Fallback: "DM Sans", sans-serif
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap');

--font-family-base: 'Geist', 'DM Sans', system-ui, sans-serif;
--font-family-mono: 'Geist Mono', 'JetBrains Mono', monospace; // URL, kod, şifre

// Scale
--text-xs:   11px;  // Meta, etiket
--text-sm:   13px;  // Tablo cell, form helper
--text-base: 14px;  // Body
--text-md:   15px;  // Kart başlık
--text-lg:   17px;  // Sayfa bölüm başlığı
--text-xl:   20px;  // Sayfa başlığı
--text-2xl:  24px;  // Dashboard metrik
--text-3xl:  30px;  // Hero metrik

// Weight
--font-regular:   400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
```

### Spacing (8px Grid)

```scss
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Border Radius

```scss
--radius-sm:  4px;    // input, badge
--radius-md:  6px;    // kart, button
--radius-lg:  10px;   // modal, panel
--radius-xl:  16px;   // büyük kart
--radius-full: 9999px; // avatar, tag
```

---

## Layout Yapısı

```
┌─────────────────────────────────────────────────────────┐
│  Topbar (64px)                                           │
│  [Logo] [Breadcrumb]          [Search] [Notif] [Avatar] │
├──────────────┬──────────────────────────────────────────┤
│              │                                           │
│  Sidebar     │  Main Content Area                        │
│  (240px)     │                                           │
│              │  ┌─────────────────────────────────────┐ │
│  Navigasyon  │  │  Page Header (başlık + aksiyon btn) │ │
│  menüsü      │  ├─────────────────────────────────────┤ │
│              │  │                                     │ │
│  Collapsible │  │  Content (tablo / kart / form)      │ │
│  (icon-only  │  │                                     │ │
│   = 64px)    │  │                                     │ │
│              │  └─────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────┘
```

### Sidebar Navigasyon

```
🏠 Dashboard
──────────────
👥 Müşteriler
📦 Ürünler
──────────────
👨‍💻 Ekipler
🧑 Kişiler
──────────────
🌐 Ortamlar
⚙️ Kaynaklar
──────────────
📚 Bilgi Tabanı
──────────────
🔐 Admin         (sadece PlatformAdmin)
  ↳ Kullanıcılar
  ↳ Özel Alanlar
  ↳ Audit Log
```

---

## Sayfa Şablonları

### 1. Liste Sayfası (ör. Müşteriler)

```
Page Header
├── Sol: "Müşteriler" başlık + "247 kayıt" badge
└── Sağ: [Yeni Müşteri] butonu

Filtre Çubuğu
├── Search input (debounce: 400ms)
├── Status filtresi (dropdown)
├── Sıralama (dropdown)
└── Arşivlenmiş toggle

DataTable (PrimeNG p-table)
├── Sütunlar: Ad, Kod, Durum, Ürün sayısı, Son güncelleme
├── Status → badge (renkli)
├── Her satır tıklanabilir → detay sayfası
├── Sağ tıklama veya üç nokta menü → Düzenle, Arşivle
└── Sayfalama: 20/50/100 seçeneği
```

### 2. Detay Sayfası (ör. Müşteri Detay)

```
Breadcrumb: Müşteriler > ACME Corp

Header Kartı
├── Sol: Ad, Kod, Durum badge
├── Orta: Kritik tarihler (go-live, vb.)
└── Sağ: [Düzenle] [Arşivle] dropdown

Tab Navigation
├── Genel Bilgiler
├── Ürünler & Ortamlar   ← en önemli tab
├── Ekip & Kişiler       (opsiyonel)
└── Bilgi Tabanı

İçerik (Tab bazlı)
```

### 3. Ortam & Kaynak Tab'ı (En Kritik Ekran)

```
[TEST] [PRODUCTION] ← ortam kartları (renkli border)

Aktif ortam: PRODUCTION (kırmızı tema)
├── Ürün: Ödeme Sistemi
│   ├── 🌐 Frontend
│   │   URL: https://payment.acme.com    [Kopyala] [Aç]
│   │   Giriş: admin / ●●●●●●●●          [Göster]
│   │
│   ├── ⚡ REST API
│   │   URL: https://api.payment.acme.com   [Kopyala]
│   │   Auth: Bearer Token
│   │   Token URL: .../connect/token        [Kopyala]
│   │   Client ID: payment-client           [Kopyala]
│   │   Client Secret: ●●●●●●●●●●●●        [Göster]
│   │
│   └── 🗄️ Kaynaklar
│       ├── PostgreSQL - Ana DB
│       │   Host: db.acme.com:5432          [Kopyala]
│       │   DB: payment_prod                [Kopyala]
│       │   User: payment_user              [Kopyala]
│       │   Pass: ●●●●●●●●●●               [Göster]
│       │
│       └── Redis - Session Cache
│           [PAYLAŞIMLI] 🔗
│           Host: redis.internal:6379       [Kopyala]
│           Pass: ●●●●●●●●                 [Göster]
```

**Kopyala butonu:** Clipboard'a kopyalar + 2 saniyelik "Kopyalandı!" feedback
**Göster butonu:** Confirm dialog → API'den reveal → 30 saniye countdown → tekrar gizler
**PRODUCTION ortamı:** Kırmızı border ve uyarı banner ("Prodüksiyon ortamı — dikkatli olun")

---

## Component Kütüphanesi

### Status Badge

```html
<!-- Durum badge'leri — renkli, tutarlı -->
<p-tag value="Active" severity="success" />
<p-tag value="Inactive" severity="secondary" />
<p-tag value="Onboarding" severity="warning" />
<p-tag value="Churned" severity="danger" />

<!-- Environment badge -->
<span class="env-badge env-badge--prod">PRODUCTION</span>
<span class="env-badge env-badge--test">TEST</span>
```

### Credential Cell (Şifre Gösterme)

```typescript
@Component({
  selector: 'kys-credential-cell',
  template: `
    <div class="credential-cell">
      <span class="credential-cell__value font-mono">
        {{ isRevealed ? value : '••••••••' }}
      </span>
      <button
        class="btn-icon"
        (click)="toggleReveal()"
        [pTooltip]="isRevealed ? 'Gizle' : 'Göster'"
        [attr.aria-label]="isRevealed ? 'Gizle' : 'Göster'">
        <i [class]="isRevealed ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
      </button>
      <button
        class="btn-icon"
        (click)="copyToClipboard()"
        pTooltip="Kopyala">
        <i class="pi pi-copy"></i>
      </button>
    </div>
  `
})
export class CredentialCellComponent {
  // 30 saniye sonra otomatik gizle
  private revealTimer?: ReturnType<typeof setTimeout>;

  async toggleReveal() {
    if (this.isRevealed) {
      this.hide();
    } else {
      // Confirm dialog → API call → göster
      const confirmed = await this.confirmService.confirm('Bu bilgiyi görüntülemek istediğinize emin misiniz?');
      if (!confirmed) return;
      this.value = await this.credentialService.reveal(this.resourceId, this.fieldKey);
      this.isRevealed = true;
      this.revealTimer = setTimeout(() => this.hide(), 30_000);
    }
  }
}
```

### Copyable URL Component

```typescript
@Component({
  selector: 'kys-copyable-url',
  template: `
    <div class="copyable-url">
      <code class="copyable-url__text">{{ url }}</code>
      <button (click)="copy()" class="btn-icon" [pTooltip]="copied ? 'Kopyalandı!' : 'Kopyala'">
        <i [class]="copied ? 'pi pi-check text-success' : 'pi pi-copy'"></i>
      </button>
      <a [href]="url" target="_blank" class="btn-icon" pTooltip="Yeni sekmede aç">
        <i class="pi pi-external-link"></i>
      </a>
    </div>
  `
})
```

---

## Form Tasarım Standartları

### Kurallar
1. Label her zaman input'un üstünde (placeholder yeterli değil)
2. Zorunlu alanlar `*` ile işaretlenir (form açıklamasında belirtilir)
3. Hata mesajları field'ın altında, kırmızı, ikon ile
4. Success durumu sadece kritik form'larda gösterilir
5. Submit butonu ilk tıklamadan sonra disabled (double submit önlemi)
6. Uzun form'lar bölümlere ayrılır (stepper veya card groups)

### Custom Field Render

```typescript
// CustomFieldDefinition'a göre dinamik form alanı render eden component
@Component({ selector: 'kys-custom-field-input' })
export class CustomFieldInputComponent {
  @Input() definition: CustomFieldDefinition;
  @Input() value: unknown;

  // field_type'a göre render:
  // Text     → <input type="text">
  // Number   → <p-inputnumber>
  // Date     → <p-calendar>
  // Boolean  → <p-inputswitch>
  // Select   → <p-dropdown [options]="definition.selectOptions">
  // Url      → <input type="url"> + "Aç" butonu
  // Email    → <input type="email">
}
```

---

## State Yönetimi (NgRx)

```
Store Yapısı:
├── auth/           ← kullanıcı, token, izinler
├── customers/      ← liste, seçili müşteri, filtreler
├── products/       ← liste, seçili ürün
├── teams/          ← ekip listesi
├── people/         ← kişi listesi
├── ui/             ← sidebar açık/kapalı, yükleme durumları
└── notifications/  ← toast mesajları

Kural: Sadece paylaşılan state NgRx'e gider.
Component-local state → component içinde kalır.
Server state (liste, detay) → NgRx veya Angular Query (tercih edilebilir)
```

---

## UX Microinteractions

### Loading States
```
Liste yüklenirken        → p-skeleton (satır satır iskelet)
Kart yüklenirken         → p-skeleton (kart iskelet)
Button işlemindeyken     → button disabled + spinner icon
Sayfa geçişlerinde       → p-progressBar (topbar altında)
```

### Boş Durumlar (Empty States)
```html
<!-- Hiç kayıt yoksa -->
<div class="empty-state">
  <img src="assets/illustrations/empty-customers.svg" alt="">
  <h3>Henüz müşteri yok</h3>
  <p>İlk müşteriyi ekleyerek başlayın.</p>
  <button pButton label="Müşteri Ekle" icon="pi pi-plus" />
</div>

<!-- Arama sonucu yoksa -->
<div class="empty-state">
  <i class="pi pi-search"></i>
  <h3>"{{ searchTerm }}" için sonuç bulunamadı</h3>
  <p>Farklı bir arama terimi deneyin.</p>
</div>
```

### Toast Bildirimleri
```typescript
// Başarı
this.toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Müşteri oluşturuldu.', life: 3000 });

// Hata
this.toast.add({ severity: 'error', summary: 'Hata', detail: 'İşlem başarısız. Lütfen tekrar deneyin.', life: 5000 });

// Uyarı (geri alınabilir işlemler)
this.toast.add({ severity: 'warn', summary: 'Uyarı', detail: 'Müşteri arşivlendi.', life: 4000 });
```

### Tehlikeli Aksiyon Onayı
```typescript
// Arşivleme, silme gibi geri dönüşü zor işlemler
this.confirmDialog.confirm({
  message: 'ACME Corp müşterisini arşivlemek istediğinize emin misiniz? Bu işlem geri alınabilir.',
  header: 'Arşivleme Onayı',
  icon: 'pi pi-exclamation-triangle',
  acceptLabel: 'Arşivle',
  rejectLabel: 'İptal',
  acceptButtonStyleClass: 'p-button-danger',
  accept: () => this.archive()
});
```

---

## Erişilebilirlik (a11y)

- WCAG 2.1 AA uyumlu
- Tüm icon-only butonlarda `aria-label`
- DataTable'da `aria-sort`, `aria-label`
- Modal'larda `aria-modal="true"`, `aria-labelledby`
- Focus trap: modal açıkken odak modal içinde kalır
- Klavye: Tab sırası mantıklı, Enter/Space buton tetikler
- Renk: Sadece renkle değil, ikon + metin kombinasyonu ile bilgi iletilir
- Credential "Göster" → screen reader sadece "Değer gösterildi" der, değeri okumaz

---

## Responsive Davranış

```
≥1280px  → Full layout (sidebar açık, tablo full)
1024px   → Sidebar collapse (sadece ikonlar)
768px    → Sidebar gizlenir, hamburger menü
<768px   → Tablo yerine kart listesi (mobil görünüm)
```

---

## Angular Proje Yapısı

```
src/
├── app/
│   ├── core/                        ← Singleton servisler, guard'lar
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── permission.guard.ts
│   │   │   └── token-interceptor.ts
│   │   ├── services/
│   │   │   └── notification.service.ts
│   │   └── core.providers.ts
│   │
│   ├── shared/                      ← Paylaşılan component'ler
│   │   ├── components/
│   │   │   ├── credential-cell/
│   │   │   ├── copyable-url/
│   │   │   ├── status-badge/
│   │   │   ├── env-badge/
│   │   │   ├── page-header/
│   │   │   ├── confirm-dialog/
│   │   │   └── empty-state/
│   │   ├── directives/
│   │   │   └── permission.directive.ts   ← *kysPerm="'customers.create'"
│   │   ├── pipes/
│   │   │   ├── time-ago.pipe.ts
│   │   │   └── truncate.pipe.ts
│   │   └── shared.module.ts
│   │
│   ├── layout/                      ← Shell (sidebar, topbar)
│   │   ├── shell/
│   │   ├── sidebar/
│   │   └── topbar/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── customers/
│   │   │   ├── customer-list/
│   │   │   ├── customer-detail/
│   │   │   │   ├── customer-detail.component.ts
│   │   │   │   ├── tabs/
│   │   │   │   │   ├── general-info/
│   │   │   │   │   ├── products-environments/
│   │   │   │   │   └── knowledge-base/
│   │   │   │   └── modals/
│   │   │   │       ├── create-customer-modal/
│   │   │   │       └── archive-customer-modal/
│   │   │   └── customer.routes.ts
│   │   ├── products/
│   │   ├── teams/
│   │   ├── people/
│   │   ├── resources/
│   │   ├── knowledge-base/
│   │   └── admin/
│   │
│   ├── store/                       ← NgRx store
│   │   ├── auth/
│   │   ├── customers/
│   │   └── ...
│   │
│   └── app.routes.ts
│
├── assets/
│   ├── illustrations/               ← Empty state SVG'leri
│   └── icons/
│
└── styles/
    ├── _variables.scss              ← CSS custom properties
    ├── _typography.scss
    ├── _layout.scss
    ├── _components.scss
    └── styles.scss                  ← PrimeNG theme override
```

---

## PrimeNG Theme Konfigürasyonu

```typescript
// app.config.ts
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '[data-theme="dark"]',
          cssLayer: false
        }
      },
      ripple: true,
      inputStyle: 'outlined'
    })
  ]
};
```

---

## Performans Kuralları (Angular)

- Standalone components kullan (NgModule yok)
- `OnPush` change detection stratejisi tüm component'lerde
- Büyük listeler: `p-virtualscroller` veya server-side pagination
- Lazy loading: her feature modülü lazy loaded (route bazlı)
- Image lazy loading: `loading="lazy"`
- `TrackBy` her `*ngFor`'da zorunlu
- `takeUntilDestroyed()` ile subscription temizleme
