# Changelog

Bu proje [Semantic Versioning](https://semver.org/lang/tr/) kullanır.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/)

---

## [Unreleased]

### Planlanan
- AD/LDAP entegrasyonu (OIDC)
- Production Docker Compose + Nginx SSL
- Integration test coverage > %80
- Load test (k6)
- Database index optimizasyonu

---

## [0.19.0] — 2026-06-10 (Sprint 22 — Tema Sistemi Faz 2: Tam Kapsam)

### Değişti
- **Tüm özellik sayfaları temalı**: Müşteriler, Ürünler, Ekipler, Kişiler, Bilgi Bankası, tüm Admin sayfaları (paylaşımlı kaynaklar, kaynak/ortam tipleri, özel alanlar, platform kullanıcıları, audit log, genel bakış), ortam detayı, arama ve login sayfasındaki hardcode hex renkler `var(--token)`'a çevrildi
- Artık 4 temanın tamamı (Açık Klasik · Koyu Slate · Koyu Midnight · Koyu OLED) uygulamanın her ekranında geçerli
- Kategori/durum rozet renkleri semantik token'lara eşlendi (yeşil→success, mor→violet, turuncu→warning, sky→primary, indigo→indigo soft çiftleri)

### Notlar
- TS içindeki renk değerleri (form default'ları `'#3B82F6'`, `[ngStyle]`/`[style]` binding'leri, durum/ortam-tipi renk haritaları) bilinçli olarak korundu — bunlar veri/dinamik değerler
- İlk kurulum (setup) ekranı kasıtlı koyu gradient marka tasarımı olduğundan tema dışında bırakıldı

---

## [0.18.0] — 2026-06-10 (Sprint 21 — Tema Sistemi Faz 1)

### Eklendi
- **Tema sistemi (açık + 3 koyu)**: CSS custom property tabanlı tema altyapısı; `styles/_themes.scss`'te 4 tema — Açık Klasik, Koyu Slate, Koyu Midnight, Koyu OLED
- **`ThemeService`**: tema seçimini `localStorage`'da saklar, ilk açılışta sistem tercihine (`prefers-color-scheme`) göre varsayılan belirler, `<html data-theme>` üzerinden uygular
- **Topbar tema seçici**: palet ikonuyla açılan, açık/koyu gruplu, renk önizlemeli (swatch) dropdown
- Semantik token sözlüğü (`--bg`, `--surface`, `--text`, `--border`, `--primary`, accent soft çiftleri, sidebar token'ları, gölgeler)

### Değişti
- Global stiller + layout (shell, sidebar, topbar) + dashboard + workspace widget hardcode hex renklerden `var(--token)`'a çevrildi — bu alanlar artık tam temalı

### Notlar
- Faz 1 kapsamı uygulama çatısı + dashboard; kalan özellik sayfaları (müşteriler, ürünler, ekipler, kişiler, KB, admin, ortam/kaynak detayları) sonraki dalgalarda token'a çevrilecek

---

## [0.17.0] — 2026-06-10 (Sprint 20 — Menü Yeniden Yapılandırma & Yetki)

### Değişti
- **Gruplu ana menü**: Sidebar başlıklı bölümlere ayrıldı — `Çalışma Alanı` (Müşteriler/Ürünler/Ekipler/Kişiler/Bilgi Bankası), `Tanımlar`, `Yönetim`
- **Tanımlar ana menüye taşındı**: Ortam Tipleri, Kaynak Tipleri, Paylaşımlı Kaynaklar artık doğrudan ana menüden erişilebilir (önceden yalnızca Admin paneli içinden)
- **Yönetim grubu**: Genel Bakış, Platform Kullanıcıları, Özel Alanlar, Audit Log

### Eklendi
- **Menü yetki kontrolü**: `Tanımlar` ve `Yönetim` grupları yalnızca PlatformAdmin (`*` izni) kullanıcılara gösterilir; diğer roller bu öğeleri görmez
- **`adminGuard`**: `/admin/*` route'ları frontend'de korumaya alındı — yetkisiz kullanıcı `/dashboard`'a yönlendirilir (önceden sayfa açılıp veriler 403 dönüyordu)
- **`PermissionService`**: localStorage'daki kullanıcı izinlerini senkron okuyan servis (`has`, `isAdmin`)

### Düzeltildi
- Sidebar tamamen boş görünüyordu: `@for ... track group.header ?? ''` ifadesindeki `??` Angular derleyicisinde `tmp_16_0 is not defined` runtime hatasına yol açıyordu → `track $index` ile düzeltildi
- `PermissionService.permissions()` bozuk localStorage kaydına karşı try/catch ile sağlamlaştırıldı

---

## [0.16.0] — 2026-06-09 (Sprint 19 — Workspace Credential Maskeleme)

### Değişti
- **Satır içi credential panelinde yalnızca şifre alanları maskeli**: Çalışma Alanım widget'ında şifre tipindeki alanlar (`••••••` + göz butonu) maskeli kalır; şifre olmayan alanlar (kullanıcı adı, host, port vb.) panel açılınca otomatik açık gösterilir
- Şifre/şifre-değil ayrımı backend'de hesaplanır: kaynaklar için `ResourceType.FieldSchema` tip bilgisi, endpoint auth alanları için `{password, clientSecret, token, apiKey}` seti (env-detay ile aynı mantık)
- `WorkspaceCredentialDto`'ya `IsSecret` alanı eklendi

---

## [0.15.0] — 2026-06-09 (Sprint 18 — Workspace Düzen İyileştirmesi)

### Değişti
- **Endpoint adı artık link**: Çalışma Alanım widget'ında endpoint satırı sadeleştirildi; uzun URL metni kaldırıldı, endpoint **adı** URL'ye link oldu (yeni sekmede açılır, URL tooltip'te). Kopyala/Swagger/Health/Auth/Credential butonları korundu. URL'si olmayan endpoint'lerde ad link olmaz, "URL yok" ibaresi gösterilir
- **Ortamlar yan yana**: Ortamlar alt alta yerine ürün grubunda responsive kart ızgarasında yan yana dizilir (Test | UAT | Prod); dar ekranda alta sarar
- **Ortam sıralaması**: Ortamlar artık `EnvironmentType.SortOrder`'a göre sıralanır (Dev → Test → UAT → Prod); önceden ada göreydi

---

## [0.14.0] — 2026-06-09 (Sprint 17 — Workspace Credential Peek)

### Eklendi
- **Çalışma Alanım widget'ında satır içi credential görüntüleme**: Endpoint ve kaynak satırlarındaki "🔑 N" rozeti artık tıklanınca satırın altında açılır panel gösterir; detay sayfasına gitmeden field key'ler listelenir
- **Talep üzerine reveal + kopyala**: Her credential göz butonuyla açılır (`GET /credentials/{id}/reveal` — yetki kontrolü + audit log korunur) ve tek tıkla kopyalanabilir; dashboard yükünde otomatik reveal yapılmaz (audit/performans)
- `WorkspaceEndpointDto` ve `WorkspaceResourceDto`'ya credential stub listesi (`id` + `fieldKey`) eklendi — ek sorgu yok, veri zaten yükleniyordu

---

## [0.13.0] — 2026-06-09 (Sprint 16 — Workspace Tip Filtreleri)

### Eklendi
- **Çalışma Alanım widget'ında tip filtreleri**: Kaynak tipine (PostgreSQL, Redis, RabbitMQ vb.) ve endpoint türüne (REST API, gRPC, Frontend vb.) göre çoklu seçimli chip filtreleri eklendi
- **Odak modu**: Yalnızca kaynak tipi seçiliyse endpoint satırları gizlenir, yalnızca endpoint türü seçiliyse kaynak satırları gizlenir; ikisi de seçiliyse her ikisi filtrelenir
- Filtre seçenekleri yüklü veriden türetilir (workspace'te var olmayan tip gösterilmez); mevcut metin araması ve "Benim/Tüm Müşteriler" kapsamıyla birlikte çalışır; tek tıkla "Temizle"
- Tamamen frontend tarafında (client-side) çalışır — ek API çağrısı yok

---

## [0.12.0] — 2026-06-09 (Sprint 15 — Paylaşımlı Kaynak İyileştirmeleri)

### Eklendi
- **Paylaşımlı kaynak ortak bağlantı bilgileri**: Admin → Paylaşımlı Kaynaklar sayfasında kaynak tipine göre dinamik bağlantı formu; hassas olmayan alanlar (host/port/vhost) `ConnectionFields`'a, şifre alanları AES-256 şifreli **shared credential** olarak saklanır
- **`GET /api/v1/resources/shared/{id}`**: Paylaşımlı kaynak detayı (bağlantı alanları + field schema + credential stub'ları) — düzenleme ekranı ve environment kalıtımı için
- **Environment'ta otomatik kalıtım**: Paylaşımlı kaynak bir ortama eklenirken ortak bilgiler (host/port/şifre) salt okunur olarak otomatik gelir; tekrar girilmez. "Bu ortam için bazı bilgileri override et" ile ortama özgü değer girilebilir
- **Şablon → Paylaşımlı Kaynak bağlama**: `ProductResourceTemplate.SharedResourceId` ile bir şablon belirli bir paylaşımlı kaynağa bağlanabilir; bu durumda environment kaynak ekleme ekranında "Paylaşımlı kaynak kullan" checkbox'ı ve seçim dropdown'ı **gizlenir**, kaynak otomatik kullanılır
- **Env detay kaynak kartı**: Paylaşımlı kaynaktan kalıtılan değerler "Paylaşılan değerler" kutusunda gösterilir (şifreler göz butonuyla açılır)

### Düzeltildi
- `SetCredentialCommandHandler` `SharedResourceId` için mevcut kayıt kontrolü yapmıyordu → güncellemede mükerrer credential oluşuyordu (`GetSharedCredentialAsync` lookup'ı eklendi)
- `GetEnvironmentByIdAsync` `SharedResource`'u include etmiyordu → `sharedResourceName` her zaman null geliyordu
- `UpdateSharedResourceCommand` `ConnectionFields`'ı kaydetmiyordu → düzenlemede bağlantı bilgileri kayboluyordu

### Migration
- `Sprint14_TemplateSharedResourceLink`: `product_resource_templates` tablosuna `shared_resource_id` (nullable FK → `shared_resources`, ON DELETE SET NULL)

---

## [0.11.0] — 2026-06-09 (Sprint 14)

### Eklendi
- **Ortam tipi düzenleme ve silme**: Admin → Ortam Tipleri sayfasında düzenleme (kalem butonu + modal) ve silme (onay dialog'u + bağımlılık kontrolü) özellikleri eklendi
- **Ortam breadcrumb tam yolu**: Ortam detay sayfası başlığı artık `Müşteriler / [Müşteri] / [Ürün] / [Ortam]` şeklinde tam yolu gösteriyor
- **Ortam kardeş geçiş pill'leri**: Ortam detay sayfasında aynı ürüne ait diğer ortamlar pill butonları olarak gösterilir; tıklanınca o ortama geçilir
- **Kaynak şablonu düzenleme**: Ürün detay sayfasında kaynak şablonlarına düzenleme (kalem butonu + modal) özelliği eklendi
- **Müşteri listesinde ürün badge'leri**: Müşteri listesinde her müşteriye ait ürünler kısa kod badge'leri olarak gösterilir; tıklanınca müşteri detayında ilgili ürüne scroll edilir
- **Ürün listesinde ekip badge'leri**: Ürün listesinde bağlı ekipler yeşil kod badge'leri olarak gösterilir; tıklanınca ekip detayına gidilir
- **Müşteriden ürün kaldırma**: Müşteri detay sayfasında ürün kartına çöp kutusu butonu eklendi; bağlı ortam varsa 409 Conflict ile engellenir
- **Ortam kaldırma**: Müşteri detay sayfasında ortam kartına çöp kutusu butonu eklendi; bağlı kaynak varsa 409 Conflict ile engellenir
- **Ortam adı opsiyonel**: Ortam oluştururken "Ortam Adı" alanı artık zorunlu değil; boş bırakılırsa ortam tipi adı otomatik kullanılır

### Düzeltildi
- Müşteri ve ortam listelerinde durum badge'leri görünmüyordu — `JsonStringEnumConverter` nedeniyle API string değer döndürüyor (`"Active"`) ancak frontend sayı bekliyordu; tüm status/usageMode map'leri string key'e çevrildi
- Ekipler listesinde üye sayısı 0 görünüyordu — `TeamRepository.GetAllAsync`'te `Include(t => t.Memberships)` eksikti
- Müşteri listesinde ürün sayısı 0 görünüyordu — `CustomerRepository.GetAllAsync`'te Products include zinciri eksikti

---

## [0.10.0] — 2026-06-09 (Sprint 13)

### Eklendi
- **Çalışma Alanım Widget'ı**: Dashboard'a Müşteri → Ürün → Ortam hiyerarşisinde anlık filtreli workspace widget eklendi; endpoint URL'leri tek tık kopyalanabilir, credential sayısı ortam detayına derin link olarak gösterilir
- **Kapsam Toggle**: Widget'ta "Benim Müşterilerim" (atanan ürünler üzerinden) / "Tüm Müşteriler" geçişi
- **`GET /api/v1/dashboard/my-workspace`**: Giriş yapan kişinin sorumlu olduğu ürünler (doğrudan atama + ekip üzerinden) filtreli environment ağacını döner; hiçbir credential değeri response'a dahil edilmez
- **Soft Delete**: Ürün, Müşteri, Ekip ve Kişi listelerinde kebab menü (⋮) + onay dialog'u ile soft delete (`IsDeleted=true`)
- **`DELETE /environments/{envId}/endpoints/{productEndpointId}`**: Ortam bazlı endpoint URL kaydını siler (ürün geneli endpoint tanımına dokunmaz); endpoint ekleme butonu ortam detayından kaldırıldı

### Düzeltildi
- `JsonStringEnumConverter` global kayıt eksikliği — endpoint tipi string enum değerleri 400 hatası veriyordu
- `SetCredentialCommandValidator` `EndpointUrlId` branch'i eksikti — endpoint credential kaydı 422 veriyordu
- Dashboard workspace widget'ında aynı müşteri birden fazla panel olarak görünüyordu — `GroupBy` entity referansı yerine `CustomerId` üzerinden yapılacak şekilde düzeltildi

---

## [0.9.0] — 2026-06-08 (Sprint 11-12)

### Eklendi
- **Endpoint Auth Credential Yönetimi**: Ortam endpoint'leri için AES-256 şifreli auth credential desteği (BasicAuth/Bearer/ApiKey/OAuth2)
- **Endpoint Bölümü Revize**: Tüm product endpoint'leri (URL girilmemiş olanlar dahil) ortam detay sayfasında gösteriliyor; "URL Belirle" akışı eklendi
- **Auth Tipi Seçimi**: Endpoint URL düzenleme modal'ına auth tipi dropdown'u eklendi
- **Resource Type FieldSchema Yönetimi**: Admin ekranında alan tanımı görüntüleme ve düzenleme (tip, label, zorunluluk, varsayılan değer)
- **Dinamik Credential Formu**: Ortama kaynak eklenirken field schema'ya göre otomatik form oluşturma
- **Credential Kart Görünümü**: Kaynak kartlarında key:value grid; şifre alanları gizli (göz butonu), diğerleri açık

### Düzeltildi
- `CurrentUserService.HasPermission` wildcard `*` desteği eklendi — PlatformAdmin credential reveal yapamıyordu
- Global arama 500 hatası: `kb_articles.visibility` sütunu integer→varchar(30) dönüşümü (CASE mapping)
- Ürün kaynak şablonu silme 500 hatası: FK constraint ihlali → 409 ConflictException ile düzgün ele alındı
- Ortam kaynağı silme özelliği eklendi (trash butonu)

### Migration
- `Sprint11_SeedResourceTypes`: 8 varsayılan kaynak tipi seed (PostgreSQL, MSSQL, Redis, RabbitMQ vb.)
- `Sprint11_FixKbVisibilityColumn`: kb_articles.visibility integer→varchar dönüşümü
- `Sprint12_EndpointUrlCredentials`: resource_credentials tablosuna endpoint_url_id FK

---

## [0.8.0] — 2026-06-07 (Sprint 9-10)

### Eklendi
- **İlk Çalıştırma Kurulum Ekranı**: Sistem hiç kullanıcı yokken otomatik setup akışı
- **Email Tabanlı Login**: Kullanıcı adı yerine email ile giriş
- **Refresh Token**: 30 günlük refresh token + session timeout uyarısı
- **Admin: Kullanıcı Yönetimi**: Şifre sıfırlama, hesap kilidi açma, sistem rolü atama
- **Ekip Kodu Alanı**: Team entity'sine `Code` kolonu eklendi
- **OrganizationRole Seed**: Varsayılan organizasyon rolleri migration ile eklendi
- **Kişi Detay Sayfası**: Profil bilgileri, ekip geçmişi, sistem rolleri görünümü
- **Ekip Detay Sayfası**: Üye yönetimi, ürün atamaları

### Düzeltildi
- Dapper snake_case → PascalCase mapping (tüm repository'ler)
- Dashboard COUNT(*) → int cast sorunu
- Admin 403 hatası: PermissionAuthorizationHandler wildcard `*` claim kontrolü

---

## [0.7.0] — 2026-06-06 (Sprint 7-8)

### Eklendi
- **Bilgi Tabanı (Knowledge Base)**: Makale listesi, detay (Markdown render), oluşturma/düzenleme editörü
- **KB Etiketleri**: Tag yönetimi, filtreleme
- **KB Görünürlük**: Internal / TeamOnly / Public seçenekleri
- **Admin: Audit Log**: Tüm Create/Update/Delete işlemleri ve credential görüntüleme kayıtları
- **Admin: Platform Kullanıcıları**: Kullanıcı listesi ve yönetim ekranı
- **Admin: Özel Alanlar**: CustomFieldDefinition yönetim arayüzü
- **Admin: Ortam Tipleri**: Renk kodlu ortam tipi yönetimi
- **Admin: Kaynak Tipleri**: ResourceType CRUD ve FieldSchema yönetimi
- **Admin: Paylaşımlı Kaynaklar**: SharedResource CRUD
- **Global Arama**: Müşteri + ürün + KB makalesi full-text arama (debounced dropdown)
- **Dashboard**: Özet metrik kartları, son aktiviteler

---

## [0.6.0] — 2026-06-05 (Sprint 5-6)

### Eklendi
- **Ortam & Kaynak Modülü** (en kritik modül):
  - Ortam tipleri (Development, Test, UAT, Production)
  - Müşteri ortamları oluşturma ve yönetme
  - Ortama kaynak şablondan ekleme
  - `ResourceCredential`: AES-256-CBC şifreli credential saklama
  - Credential reveal: `GET /credentials/{id}/reveal` → şifre çözme + audit log
  - `ResourceAuthorizationService`: kaynak bazlı yetkilendirme
  - Endpoint URL yönetimi (`CustomerEnvironmentEndpoint`)
  - Paylaşımlı kaynak (`SharedResource`) desteği
- **Ortam Detay Sayfası**: Kaynaklar, credential yönetim modal, endpoint URL'leri

---

## [0.5.0] — 2026-06-05 (Sprint 4)

### Eklendi
- **Müşteri Modülü**: Müşteri listesi, detay, oluşturma/düzenleme
- **Lifecycle Yönetimi**: Prospect → Onboarding → Active → Churned → Archived akışı
- **Müşteri-Ürün İlişkisi**: SaaS/Dedicated/Hybrid kullanım modeli, ürün ekleme
- **Arşivleme**: `is_archived`, `service_ended_at` iş kuralları

---

## [0.4.0] — 2026-06-05 (Sprint 3)

### Eklendi
- **Dinamik Özel Alanlar**: `CustomFieldDefinition` entity, JSONB `custom_fields` kolonu
- **Custom Field Validation**: Tip kontrolü, zorunlu alan kontrolü, select seçenek doğrulama
- **MediatR Behavior**: `CustomFieldValidationBehavior` — her create/update'de otomatik validate

---

## [0.3.0] — 2026-06-05 (Sprint 2)

### Eklendi
- **Ürün Modülü**: Ürün listesi, detay, oluşturma/düzenleme (SaaS/CustomerBased/Hybrid tipleri)
- **Ürün Endpoint'leri**: Endpoint tanımlama ve yönetme
- **Kaynak Şablonları**: `ProductResourceTemplate` — ürüne bağlı kaynak şablonu yönetimi
- **Ekip-Ürün İlişkisi**: Ürüne ekip atama
- **Kişi-Ürün Ataması**: Ürüne çalışan atama

---

## [0.2.0] — 2026-06-05 (Sprint 1)

### Eklendi
- **Identity Modülü**: Email tabanlı login, JWT access token, refresh token, `GET /auth/me`
- **Kişi Yönetimi**: Listeleme, detay, oluşturma, güncelleme, istihdam durumu değiştirme
- **Ekip Yönetimi**: Listeleme, detay, oluşturma, üye ekleme/çıkarma (tarihçeli)
- **Sistem Rolleri**: 5 sistem rolü (PlatformAdmin, Direktör, EkipLideri, Geliştirici, SaltOkuma)
- **Permission-Based Auth**: `RequirePermissionAttribute` + `PermissionAuthorizationHandler`
- **OrganizationRole**: Ekip içi rol yönetimi
- **TeamMembership Tarihçesi**: Üyelik değişimlerinde eski kayıt kapatılır, yeni açılır

---

## [0.1.0] — 2026-06-05 (Sprint 0)

### Eklendi
- Clean Architecture iskelet: Domain / Application / Infrastructure / Api katmanları
- EF Core 10 + Npgsql + PostgreSQL; `AppDbContext`, naming conventions
- `BaseEntity`, `AuditableEntity`, `ISoftDelete` base class'ları
- Soft delete interceptor, timestamp interceptor, audit log interceptor
- `IEncryptionService` + AES-256-CBC implementasyonu (`AesEncryptionService`)
- `IJwtService` + implementasyonu (HS256, access + refresh token)
- `ICurrentUserService` + implementasyonu (claim tabanlı)
- Global exception handler (RFC 7807 ProblemDetails: 400/404/409/403/500)
- Serilog yapılandırması (Console + File sink)
- Swagger/OpenAPI (API versioning ile)
- CORS yapılandırması
- `IMemoryCache` altyapısı
- Docker Compose (PostgreSQL + API + Angular + Nginx)
- Angular 18 standalone proje iskeleti
- NgRx auth state (login, logout, token refresh)
- HTTP interceptor (JWT ekleme + 401 → logout)
- Shell layout (sidebar + topbar)
- Lazy loaded routing
- `NetArchTest` mimari test projesi: Domain→Infrastructure bağımlılık yasağı
