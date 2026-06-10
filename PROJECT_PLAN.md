# PROJECT_PLAN.md — KYS Platform Geliştirme Planı

**Sürüm:** 1.0
**Hedef:** Web tabanlı kurumsal yazılım yönetim platformu
**Stack:** ASP.NET Core 10 + Angular 18 + PostgreSQL 16

---

## Güncel Durum (2026-06-09)

Sprint 0–8 tamamlandı. Sprint 11–13 kapsamında plan dışı özellikler geliştirildi (bkz. aşağıda).
Sprint 9 (AD entegrasyonu) ve Sprint 10 (production hazırlığı) henüz başlanmadı.

---

## Faz Planı

```
Faz 1 (Sprint 0-3): Temel Altyapı + Organizasyon + Ürün  [✅ Tamamlandı]
Faz 2 (Sprint 4-6): Müşteri + Ortam + Kaynak             [✅ Tamamlandı]
Faz 3 (Sprint 7-8): Dashboard + UX Polishing              [✅ Tamamlandı]
Faz 4 (Sprint 9):   Knowledge Base + Admin                [✅ Tamamlandı]
Faz 5 (Sprint 10):  AD Entegrasyonu + Güvenlik Sertleme   [🔄 Devam Ediyor]
```

---

## Sprint 0 — Proje İskeleti ve Altyapı ✅

**Amaç:** Sıfırdan çalışan bir proje iskeleti; hiç özellik yok ama her şey doğru yapılandırılmış.

### Backend Görevleri

- [x] Solution yapısı: `Kys.sln`, 4 proje (Domain, Application, Infrastructure, Api)
- [x] `Directory.Build.props`: nullable, implicit usings, warnings as errors, analyzers
- [x] `global.json`: .NET 10 SDK sürümü pin'lendi
- [x] EF Core + Npgsql kurulum + `AppDbContext`
- [x] `BaseEntity`, `AuditableEntity`, `ISoftDelete` base class'ları
- [x] Soft delete interceptor (`SaveChangesInterceptor`)
- [x] Timestamp interceptor (updated_at otomatik)
- [x] Audit log interceptor (temel yapı)
- [x] JWT authentication + refresh token altyapısı
- [x] `ICurrentUserService` + implementasyonu
- [x] `IEncryptionService` + AES-256-CBC implementasyonu
- [x] Global exception handler (RFC 7807 ProblemDetails)
- [x] Correlation ID middleware
- [x] Serilog yapılandırması
- [x] Swagger/OpenAPI yapılandırması (versioning ile)
- [x] Health check endpoint'leri (`/health/live`, `/health/ready`)
- [x] Rate limiting altyapısı
- [x] CORS yapılandırması
- [x] `Program.cs` composition root (layer extension methods)

### Infrastructure Görevleri

- [x] `docker-compose.yml`: PostgreSQL, uygulama container'ı
- [x] `Dockerfile.api`: multi-stage build
- [x] `.env.example`: environment variable'lar belgelenmiş
- [x] `.gitignore`: kapsamlı, .env dahil
- [ ] `scripts/db-migrate.sh`
- [ ] `scripts/seed-dev.sh` (geliştirme ortamı seed verisi)

### Frontend Görevleri

- [x] Angular 18 standalone project oluşturma
- [x] PrimeNG 17 kurulum ve tema yapılandırması
- [x] NgRx store kurulum (auth slice)
- [x] HTTP interceptor (JWT token ekleme + 401 → logout)
- [x] Auth guard + permission guard
- [x] Shell layout (sidebar + topbar)
- [x] Lazy loaded routing yapısı
- [ ] CSS variables (`_variables.scss`) — tam tasarım sistemi

### CI/CD Görevleri

- [ ] `.github/workflows/pr.yml`: build + test + format
- [ ] `.github/pull_request_template.md`
- [ ] Pre-commit hook (gizli veri tarama + format)

### Mimari Testler

- [x] `Kys.Architecture.Tests` projesi oluşturma (NetArchTest)
- [x] Domain → Infrastructure bağımlılık yasağı testi
- [x] Controller → business logic yasağı testi
- [x] Entity → API response yasağı testi

---

## Sprint 1 — Identity & Organization Modülü ✅

### Backend

- [x] `Person` entity + EF Core configuration
- [x] `PersonRepository` (IPersonRepository + implementasyon)
- [x] Queries: `GetPeople`, `GetPersonDetail`
- [x] Commands: `CreatePerson`, `UpdatePerson`, `UpdateEmploymentStatus`
- [x] Validators tümü için
- [x] `PeopleController` (GET list, GET detail, POST, PATCH, PATCH status)
- [x] Login endpoint (Auth) + JWT üretimi + refresh token
- [x] `GET /api/v1/auth/me` endpoint'i

- [x] `SystemRole` entity + seed data (5 rol)
- [x] `PersonSystemRole` entity
- [x] Permission-based authorization middleware
- [x] `RequirePermissionAttribute` + handler
- [x] `GET/POST/DELETE /api/v1/admin/users/{id}/system-roles`

- [x] `Team`, `OrganizationRole`, `TeamMembership` entity'leri
- [x] Repository'ler
- [x] Queries: `GetTeams`, `GetTeamDetail`, `GetTeamMembers`, `GetPersonTeamHistory`
- [x] Commands: `CreateTeam`, `UpdateTeam`, `AddTeamMember`, `EndTeamMembership`
- [x] `TeamsController` + endpoints
- [x] `PeopleController`'a team membership endpoint'leri ekleme

### Frontend

- [x] Auth feature: login sayfası (form, validasyon, hata mesajları)
- [x] NgRx auth state: login, logout, token refresh, permissions
- [x] People feature: kişi listesi, kişi detay sayfası, kişi oluşturma/düzenleme modal
- [x] Teams feature: ekip listesi, ekip detay sayfası, üye ekleme/çıkarma

### Testler
- [x] `CreatePersonCommandHandler` unit test
- [x] `AddTeamMemberCommandHandler` unit test
- [ ] `PeopleController` integration test
- [ ] `TeamsController` integration test

---

## Sprint 2 — Product Modülü ✅

### Backend

- [x] `Product`, `ProductTeam`, `ProductAssignment` entity'leri
- [x] `ProductEndpoint`, `ProductResourceTemplate` entity'leri
- [x] Repository'ler
- [x] Queries: `GetProducts`, `GetProductDetail`, `GetProductEndpoints`, `GetProductAssignments`, `GetProductResourceTemplates`
- [x] Commands: `CreateProduct`, `UpdateProduct`, `AssignTeamToProduct`, `AssignPersonToProduct`, `CreateProductEndpoint`, `UpdateProductEndpoint`, `DeleteProductEndpoint`, `CreateProductResourceTemplate`, `DeleteProductResourceTemplate`
- [x] `ProductsController` + tüm endpoints

### Frontend

- [x] Product listesi sayfası (tip filtreleri: SaaS/CustomerBased/Hybrid)
- [x] Product detay sayfası (genel bilgi, endpoint'ler, çalışanlar, kaynak şablonları)
- [x] Endpoint yönetimi (ekle, düzenle, sil)
- [x] Kaynak şablonu yönetimi

### Testler
- [x] `CreateProductCommandHandler` unit test
- [ ] `ProductsController` integration test

---

## Sprint 3 — Custom Fields Modülü ✅

### Backend

- [x] `CustomFieldDefinition` entity + repository
- [x] `CustomFieldValidatorService`
- [x] Queries: `GetCustomFieldDefinitions`
- [x] Commands: `CreateCustomFieldDefinition`, `UpdateCustomFieldDefinition`, `ToggleCustomFieldDefinition`
- [x] `CustomFieldBehavior` (MediatR pipeline behavior)
- [x] `Admin/CustomFieldsController`

### Frontend

- [x] Admin → Özel Alanlar sayfası (müşteri ve ürün alanları, oluşturma, toggle)
- [x] `CustomFieldInputComponent` (tipe göre dinamik input render — Customer/Product formlarında)
- [ ] Alan sıralama (drag & drop)

### Testler
- [x] `CustomFieldValidatorService` unit test

---

## Sprint 4 — Customer Modülü ✅

### Backend

- [x] `Customer`, `CustomerProduct` entity'leri
- [x] Repository'ler
- [x] Queries: `GetCustomers`, `GetCustomerDetail`, `GetCustomerProducts`
- [x] Commands: `CreateCustomer`, `UpdateCustomer`, `UpdateCustomerStatus`, `ArchiveCustomer`, `RestoreCustomer`, `AddProductToCustomer`
- [x] `CustomersController` + tüm endpoints

### Frontend

- [x] Customer listesi sayfası (search, status filtresi, arşiv toggle)
- [x] Customer detay sayfası (header kartı, genel bilgiler, ürünler tab'ı)
- [x] Customer oluşturma/düzenleme modal
- [x] Status değiştirme akışı
- [x] Ürün ekleme modal

### Testler
- [x] `ArchiveCustomerCommandHandler` unit test
- [ ] `CustomersController` integration test

---

## Sprint 5 — Environment & Resource Modülü ✅

### Backend

- [x] `EnvironmentType`, `CustomerEnvironment` entity'leri
- [x] `ResourceType`, `SharedResource`, `ProductSharedResource` entity'leri
- [x] `EnvironmentResource` entity'si
- [x] `ResourceCredential` entity'si (şifreli)
- [x] `CustomerEnvironmentEndpoint` entity'si (AuthType, AuthConfig dahil)
- [x] Repository'lerin tümü
- [x] Queries: `GetEnvironmentTypes`, `GetCustomerEnvironments`, `GetEnvironmentDetail`, `GetResourceTypes`, `GetSharedResources`
- [x] Commands: `CreateEnvironmentType`, `CreateCustomerEnvironment`, `CreateResourceType`, `CreateSharedResource`, `AddResourceToEnvironment`, `RemoveEnvironmentResource`, `SetEnvironmentEndpointUrl`, `UpdateResourceType`, `UpdateSharedResource`, `DeleteResourceType`, `DeleteSharedResource`
- [x] `EnvironmentsController`
- [x] `ResourcesController`
- [x] `SetCredential` command (şifreli kaydetme) — EnvironmentResource + SharedResource + EndpointUrl
- [x] `RevealCredential` handler (şifre çözme + audit log)
- [x] `DeleteCredential` command
- [x] `CredentialsController`
- [x] `ResourceAuthorizationService` (resource + endpoint bazlı auth)

### Frontend

- [x] Environment Types yönetim sayfası (admin)
- [x] Resource Types yönetim sayfası (admin, field schema editörü)
- [x] Shared Resources yönetim sayfası
- [x] Ortam detay sayfası (kaynaklar, credential yönetim modal, endpoint URL'leri)
- [x] Endpoint auth credential yönetimi (Auth Yönet butonu, auth tipi seçimi)
- [x] Kaynak ekleme (şablondan seçme + dinamik form)
- [x] Credential kart görünümü (şifre/metin ayrımı, göz butonu)
- [x] Ortam kaynağı silme

### Testler
- [x] `AesEncryptionService` unit test
- [ ] `RevealCredentialHandler` unit test (yetki kontrolü + audit log)
- [ ] `ResourceAuthorizationService` unit test
- [ ] `CredentialsController` integration test

---

## Sprint 6 — Dashboard & Arama ✅

### Backend

- [x] Dashboard query: özet istatistikler
- [x] Dashboard query: son aktiviteler
- [x] Global arama endpoint: `GET /api/v1/search?q=...`

### Frontend

- [x] Dashboard sayfası (metrik kartları, son aktiviteler, hızlı linkler)
- [x] Global arama (topbar search, debounced, kategori bazlı sonuçlar)

---

## Sprint 7 — Knowledge Base Modülü ✅

### Backend

- [x] `KbArticle`, `KbTag`, `KbArticleTag` entity'leri
- [x] Full-text search (PostgreSQL tsvector)
- [x] Queries: `GetArticles`, `GetArticleDetail`, `GetTags`
- [x] Commands: `CreateArticle`, `UpdateArticle`, `DeleteArticle`
- [x] `KnowledgeBaseController`

### Frontend

- [x] KB listesi sayfası (tag filtresi, arama, görünürlük badge'leri)
- [x] KB detay sayfası (Markdown render, etiketler)
- [x] KB oluşturma/düzenleme (Markdown editör split view, etiket seçimi)

---

## Sprint 8 — Admin Modülü & Audit Log ✅

### Backend

- [x] `AuditLog` entity + repository
- [x] Queries: `GetAuditLogs` (sayfalı, filtreli)
- [x] `Admin/AuditLogController`
- [x] `Admin/UsersController` (kullanıcı listesi, şifre sıfırlama, kilit açma)
- [x] Platform istatistikleri endpoint'i

### Frontend

- [x] Admin: Kullanıcılar sayfası (platform erişim yönetimi, şifre sıfırlama, kilit açma, rol atama)
- [x] Audit Log sayfası (filtreleme, timeline görünümü, CredentialRevealed vurgu)
- [x] Özel Alanlar sayfası (tam UI)

---

## Sprint 9 — AD Entegrasyonu & Güvenlik Sertleme 🔄

### Backend

- [ ] OIDC middleware kurulumu
- [ ] AD kullanıcısı → Platform rol eşleme servisi
- [ ] Hibrit auth: Internal Identity OR AD
- [ ] Kullanıcı ilk AD girişinde otomatik person kaydı oluşturma
- [ ] Login endpoint: provider otomatik belirleme
- [ ] Revoked token cleanup background service

### Güvenlik Sertleme
- [ ] Penetration test checklist
- [ ] OWASP Top 10 kontrol
- [x] Rate limiting (tüm endpoint'ler)
- [x] Health check endpoint'leri (`/health/live`, `/health/ready`)
- [ ] Dependency vulnerability audit

### Frontend
- [ ] "AD ile Giriş" butonu login sayfasına
- [ ] OIDC redirect akışı
- [x] Session timeout uyarısı (token expire olmadan 2 dakika önce)

---

## Sprint 10 — Polish, Test & Go-Live Hazırlığı 🔄

### Backend
- [ ] Integration test coverage > %80
- [ ] Load test (k6 veya NBomber)
- [ ] Database index optimizasyonu
- [ ] PgBouncer yapılandırması (docker-compose.prod.yml)

### Frontend
- [x] Angular production build optimizasyonu
- [ ] PWA manifest (opsiyonel)
- [x] Error boundary (global hata yakalama)
- [ ] Accessibility audit (axe-core)
- [ ] Cross-browser test

### DevOps
- [x] `docker-compose.yml` (development)
- [ ] `docker-compose.prod.yml` (production: volume'lar, restart policy)
- [ ] Nginx SSL yapılandırması
- [ ] `README.md`: production deployment rehberi
- [ ] Backup stratejisi dokümantasyonu

### Dokümantasyon
- [ ] API Swagger tam ve güncel
- [x] `CHANGELOG.md` güncel tutulmakta
- [ ] Kullanıcı kılavuzu
- [ ] Admin kılavuzu

---

## Sprint 11-12 — Plan Dışı Geliştirmeler ✅ (2026-06-08)

Plana dahil olmayan ama geliştirilen özellikler:

- [x] Resource Type FieldSchema yönetimi (admin ekranı, görüntüleme + düzenleme)
- [x] Ortama kaynak ekleme: field schema'ya göre dinamik credential formu
- [x] Credential kart görünümü: tip farkındalıklı (şifre gizli, diğerleri açık, göz butonu)
- [x] Ortam kaynağı silme (FK kontrolü ile)
- [x] Ürün kaynak şablonu silme: FK conflict → 409 hatası ile kullanıcıya bildirim
- [x] Endpoint auth credential yönetimi (BasicAuth/Bearer/ApiKey/OAuth2)
- [x] Ortam detay: URL'siz endpoint'leri de göster + "URL Belirle" akışı
- [x] Global arama KB visibility integer→string fix
- [x] `CurrentUserService.HasPermission` wildcard `*` fix
- [x] İlk çalıştırma kurulum ekranı (Setup flow)
- [x] People detay sayfası
- [x] Team detay sayfası

---

## Düzeltme — Özel Alan Enum Eşleşmesi ✅ (2026-06-10)

- [x] Frontend'de özel alan `entityType`/`fieldType` sayısal karşılaştırmaları string enum adına çevrildi (JsonStringEnumConverter uyumu) → admin liste + ürün/müşteri form tip render hatası giderildi

---

## Sprint 30 — Yetkilendirme Faz 3 (Okuma Kapsamı) ✅ (2026-06-10)

Bkz. `docs/AUTHORIZATION.md` §10. **Katman B (kayıt düzeyi okuma) — ürün + müşteri**.

- [x] `scope:global` yeteneği + CTO seed (migration `Sprint29_ScopeGlobalCto`)
- [x] `IScopeService`: `CanReadAsync` + `HasGlobalReadAccess` + `CurrentUserId`; `ScopeKind.Customer`
- [x] Ürün/müşteri repo `GetAllAsync(scopeUserId)` filtresi
- [x] Liste handler'ları kapsam geçirir; detay handler'ları kapsam dışıysa 403
- [x] **Faz 3b:** ortam okuma kapsamı (detay + liste 403); ekip/kişi bilinçli global dizin
- [x] **Faz 4a:** açık `AccessGrant` tablosu + `IGrantService` + ScopeService/PermissionHandler entegrasyonu + admin API
- [x] **Faz 4b:** "Erişim Yetkileri" frontend ekranı (`/admin/access-grants`)
- [x] **Faz 5:** frontend cila — global 403 toast + detay aksiyon butonları yeteneğe göre gizli

### Yetkilendirme kalan (opsiyonel iyileştirmeler)
- Team-grant'ın ürün devralımı; PO/TeamLead'in grant verme yetkisi (şu an admin:users)
- Ekip/kişi liste kapsamı (şu an bilinçli global dizin)
- Detay alt-aksiyon butonlarının (endpoint/atama/şablon ekle-sil) yeteneğe göre gizlenmesi (şu an 403+toast ile korunuyor)

---

## Sprint 29 — Yetkilendirme Faz 2 (Yazma Kapsamı) ✅ (2026-06-10)

Bkz. `docs/AUTHORIZATION.md` §10. **Katman B (kayıt düzeyi yazma)**.

- [x] `IScopeService` + `ScopeTarget`/`ScopeKind` + `IScopedCommand` marker (Domain)
- [x] `ScopeAuthorizationBehavior` (MediatR pipeline) + `ScopeService` impl + DI
- [x] 19 yazma komutu marker'landı (ürün + ortam + alt kayıtları); endpoint/template komutlarına `ProductId`
- [x] `ScopeAuthorizationBehaviorTests` (3 test geçti)
- [x] **Faz 2b:** müşteri (CreatedBy/PO/ekip) + credential yazma kapsamı
- [x] **Faz 3:** okuma kapsamı (liste filtreleme)

---

## Sprint 28 — Yetkilendirme Faz 0+1 ✅ (2026-06-10)

Bkz. `docs/AUTHORIZATION.md`. İki katmanlı modelin **Katman A (aksiyon yetkisi)** kısmı.

- [x] `Capabilities` sabitleri + `PermissionAuthorizationHandler`/`PermissionService` wildcard (`*`, `alan:*`)
- [x] Rol seed yenilendi: PO + CTO eklendi, Director=`*`, TeamLead/Developer/ReadOnly capability'leri (migration `Sprint28_AuthzCapabilities`)
- [x] Tüm yazma endpoint'lerine `[RequirePermission(capability)]` (customers/products/teams/people/environments/kb/credentials/admin/resources)
- [x] Frontend ana create butonları yeteneğe göre gizlenir
- [ ] **Faz 2-3 (kapsam):** kayıt düzeyi okuma/yazma filtreleme (Developer/PO/TeamLead kendi kapsamı)
- [ ] **Faz 4:** `Grant` tablosu (süreli yetki + PO-devir) + admin ekranı

---

## Sprint 27 — Hesabım & Şifre Değiştirme ✅ (2026-06-10)

- [x] `ChangePassword` command + `POST /auth/change-password` (mevcut şifre doğrulama, min 8, refresh token sıfırlama)
- [x] **Hesabım** sayfası (`/account`): profil özeti + şifre değiştir formu; topbar kullanıcı adı link
- [x] Kapsam dışı (bilinçli): profil bilgisi düzenleme — Kişiler modülü zaten karşılıyor

---

## Sprint 26 — Ürün Ekip/Çalışan Kaldırma ✅ (2026-06-10)

- [x] Ürün detayı Ekipler + Çalışanlar sekmelerine kaldır (çöp kutusu) butonu
- [x] `RemoveTeamFromProduct` / `RemovePersonFromProduct` command + repo remove metodları + `DELETE` endpoint'leri

---

## Sprint 25 — Dashboard Sadeleştirme ✅ (2026-06-10)

- [x] Dashboard "Son Aktiviteler" paneli kaldırıldı (orphan frontend kod + CSS temizlendi); `GET /dashboard/recent-activities` endpoint'i ileride yeniden kullanım için korundu

---

## Sprint 24 — Barındırma Platformu ✅ (2026-06-10)

Ortamların hangi platformda çalıştığını (K8s/Linux/Windows/AWS/Azure/GCP) tanımlama ve gösterme.

- [x] `HostingPlatform` entity (admin-yönetimli katalog: ad, kod, kategori, ikon, renk) + migration (7 seed) + `CustomerEnvironment.HostingPlatformId` FK
- [x] CRUD: GetHostingPlatforms + Create/Update/Delete + `Admin/HostingPlatformsController` + public GET
- [x] Ortam oluşturmada platform seçimi + `SetEnvironmentHostingPlatform` (`PUT /environments/{id}/hosting-platform`)
- [x] DTO'lara platform bilgisi: env detay, ortam listesi, workspace
- [x] Admin **Barındırma Platformları** sayfası (token temalı) + route + sidebar "Tanımlar"
- [x] Gösterim: env detay başlığı (+ değiştirme), müşteri detay ortam kartı, workspace env kartı — ikon+renkli rozet

---

## Sprint 23 — Workspace Varsayılan Kapalı ✅ (2026-06-10)

- [x] Çalışma Alanım widget'ında müşteri satırları varsayılan kapalı (`collapsed` → `expanded` mantığı); arama/tip filtresi aktifken otomatik açılır

---

## Sprint 22 — Tema Sistemi (Faz 2: Tam Kapsam) ✅ (2026-06-10)

- [x] Kalan ~21 bileşendeki hardcode hex renkler `var(--token)`'a çevrildi (tırnaklı TS renk değerleri korundu)
- [x] Kategori/durum rozet renkleri semantik token'lara eşlendi
- [x] Tüm uygulama 4 temada (Açık Klasik · Koyu Slate/Midnight/OLED) tutarlı
- [x] Setup ekranı kasıtlı koyu marka tasarımı olarak hariç tutuldu

---

## Sprint 21 — Tema Sistemi (Faz 1) ✅ (2026-06-10)

Açık + 3 koyu tema; aşamalı refactor.

- [x] **Token altyapısı**: `styles/_themes.scss` — 4 tema (Açık Klasik, Koyu Slate/Midnight/OLED) semantik CSS custom property setleri
- [x] **`ThemeService`**: localStorage kalıcılık + `prefers-color-scheme` varsayılanı + `<html data-theme>`
- [x] **Topbar tema seçici**: gruplu, swatch önizlemeli dropdown
- [x] **Faz 1 refactor**: global stiller + shell/sidebar/topbar + dashboard + workspace widget `var(--token)`'a çevrildi
- [x] **Faz 2 (Sprint 22)**: customers, products, teams, people, knowledge-base, tüm admin sayfaları, environment detayı, arama, login → token refactor tamamlandı (setup ekranı kasıtlı koyu tasarım, hariç)

---

## Sprint 20 — Menü Yeniden Yapılandırma & Yetki ✅ (2026-06-10)

- [x] **Gruplu sidebar**: `Çalışma Alanı` / `Tanımlar` / `Yönetim` başlıklı bölümler
- [x] **Tanımlar ana menüde**: Ortam Tipleri, Kaynak Tipleri, Paylaşımlı Kaynaklar admin panelinden ana menüye taşındı
- [x] **Menü yetki gizleme**: `Tanımlar` ve `Yönetim` yalnızca PlatformAdmin'de görünür (`PermissionService.isAdmin`)
- [x] **`adminGuard`**: `/admin/*` route koruması; yetkisiz → `/dashboard`
- [x] **`PermissionService`**: localStorage izinlerini senkron okur (`has`, `isAdmin`)

---

## Sprint 19 — Workspace Credential Maskeleme ✅ (2026-06-09)

- [x] **Yalnızca şifre alanları maskeli**: Satır içi panelde şifre alanları göz butonuyla maskeli; diğer alanlar panel açılınca otomatik açık
- [x] **`IsSecret` backend hesabı**: Kaynaklar `ResourceType.FieldSchema` tipi, endpoint'ler `{password, clientSecret, token, apiKey}` seti
- [x] `WorkspaceCredentialDto`'ya `IsSecret` eklendi; frontend non-secret alanları otomatik reveal eder

---

## Sprint 18 — Workspace Düzen İyileştirmesi ✅ (2026-06-09)

- [x] **Endpoint adı = link**: URL metni kaldırıldı, ad yeni sekmede açılan link oldu; URL'siz endpoint'te "URL yok"
- [x] **Ortamlar yan yana**: Ürün grubunda responsive kart ızgarası (`ws-env-grid`); dar ekranda sarar
- [x] **Ortam sıralaması**: `DashboardRepository`'de `EnvironmentType.SortOrder`'a göre sıralama

---

## Sprint 17 — Workspace Credential Peek ✅ (2026-06-09)

- [x] **Satır içi credential paneli**: Çalışma Alanım widget'ında endpoint/kaynak credential rozetleri açılır panele dönüştürüldü; detaya gitmeden field key listesi
- [x] **Talep üzerine reveal/copy**: Mevcut `GET /credentials/{id}/reveal` (audit log + yetki) tekrar kullanıldı; otomatik reveal yok
- [x] **DTO**: `WorkspaceEndpointDto` + `WorkspaceResourceDto`'ya credential stub listesi (id + fieldKey)

---

## Sprint 16 — Workspace Tip Filtreleri ✅ (2026-06-09)

- [x] **Çalışma Alanım widget'ı tip filtreleri**: Kaynak tipi + endpoint türü için çoklu seçimli chip filtreleri (frontend-only, `workspace-widget.component.ts`)
- [x] **Odak modu davranışı**: Seçilen tip grubuna göre ilgili satırlar gösterilir, diğer satır türü gizlenir; her iki grup seçiliyse ikisi de filtrelenir
- [x] Filtre seçenekleri yüklü veriden türetilir; metin araması + kapsam toggle ile birlikte çalışır

---

## Sprint 15 — Paylaşımlı Kaynak İyileştirmeleri ✅ (2026-06-09)

Paylaşımlı kaynak (Graylog, Redis, RabbitMQ gibi ortak sunucular) akışı baştan sona düzeltildi.

- [x] **Admin paylaşımlı kaynak formu**: Kaynak tipine göre dinamik bağlantı alanları; normal alanlar `SharedResource.ConnectionFields` (düz JSONB), şifre alanları AES-256 shared credential olarak kaydedilir
- [x] **`GetSharedResourceDetailQuery` + `GET /resources/shared/{id}`**: bağlantı alanları + field schema + credential stub'ları döner
- [x] **`UpdateSharedResourceCommand` + `ConnectionFields`**: düzenlemede bağlantı bilgileri korunur
- [x] **`SetCredentialCommandHandler` shared lookup fix**: `GetSharedCredentialAsync` ile mükerrer credential önlendi
- [x] **Environment kalıtımı**: paylaşımlı kaynak eklerken ortak bilgiler salt okunur otomatik gelir; `GetEnvironmentDetailQuery` `SharedConnectionFields` + `SharedCredentials` döner; opsiyonel override toggle
- [x] **`GetEnvironmentByIdAsync` SharedResource include fix**: `sharedResourceName` null sorunu giderildi
- [x] **Şablon → paylaşımlı kaynak bağlama**: `ProductResourceTemplate.SharedResourceId` (migration `Sprint14_TemplateSharedResourceLink`); bağlı şablonlarda environment ekleme ekranında checkbox + dropdown gizlenir, kaynak otomatik kullanılır

---

## Sprint 14 — Plan Dışı Geliştirmeler ✅ (2026-06-09)

- [x] **Ortam tipi CRUD tamamlandı**: Admin → Ortam Tipleri sayfasına düzenleme (PUT) ve silme (DELETE, bağımlılık kontrolü ile) eklendi
- [x] **Ortam breadcrumb tam yolu**: Ortam detay sayfasında `Müşteriler / [Müşteri] / [Ürün] / [Ortam]` tam navigasyon yolu; `GetEnvironmentDetailQuery`'ye `CustomerId`, `CustomerName`, `ProductName` eklendi
- [x] **Ortam kardeş geçiş**: Ortam başlığının altında aynı ürünün diğer ortamlarına geçiş pill'leri
- [x] **Kaynak şablonu düzenleme**: `UpdateProductResourceTemplate` command + `PUT /products/{id}/resource-templates/{templateId}` endpoint
- [x] **Müşteri listesinde ürün badge'leri**: `GetCustomersQueryHandler`'a Products include + `CustomerProductBadgeDto`; tıklanınca müşteri detayında ürün tab'ına deep-link
- [x] **Ürün listesinde ekip badge'leri**: `GetProductsQueryHandler`'a Team include + `ProductTeamBadgeDto`; tıklanınca ekip detayına navigate
- [x] **Müşteriden ürün kaldırma**: `RemoveCustomerProduct` command (ortam varsa 409) + `DELETE /customers/{id}/customer-products/{cpId}` endpoint
- [x] **Ortam kaldırma**: `DeleteCustomerEnvironment` command (kaynak varsa 409) + `DELETE /environments/{id}` endpoint
- [x] **Ortam adı opsiyonel**: `CreateCustomerEnvironmentCommand.Name` → `string?`; boşsa `EnvironmentType.Name` kullanılır
- [x] **Enum string serializasyonu düzeltmesi**: Frontend status/usageMode map'leri numeric'ten string key'e çevrildi (CustomerStatus, CustomerProductStatus, UsageMode)

---

## Sprint 13 — Plan Dışı Geliştirmeler ✅ (2026-06-09)

- [x] **Soft delete**: Ürün, Müşteri, Ekip, Kişi listelerinde kebab menü (⋮) + onay dialog + soft delete
- [x] **Dashboard "Çalışma Alanım" widget'ı**: Müşteri → Ürün → Ortam hiyerarşisi, anlık filtre, URL kopyala, `GET /dashboard/my-workspace` (kişiye atanmış ürünler bazlı kapsam + "Tüm Müşteriler" toggle)
- [x] **Ortam endpoint kapsam düzeltmesi**: Endpoint Ekle butonu ortam detayından kaldırıldı (product-level tanım); silme artık yalnızca `CustomerEnvironmentEndpoint` URL kaydını siler (`DELETE /environments/{envId}/endpoints/{productEndpointId}`)
- [x] **`JsonStringEnumConverter` global kayıt** — enum string değerleri 400 hata veriyordu
- [x] **`SetCredentialValidator` `EndpointUrlId` branch eksikliği** — endpoint credential 422 hata veriyordu

---

## Sonraki Adımlar (Öncelik Sırası)

### Kısa Vadeli (Teknik Borç / Güvenlik) ✅ Tamamlandı
1. ~~**Rate limiting**~~ — ✅ IP başına FixedWindow; global 150/dk, auth 10/15dk
2. ~~**Health check endpoint'leri**~~ — ✅ `/health/live` ve `/health/ready`
3. ~~**`CustomFieldInputComponent`**~~ — ✅ `shared/components/custom-field-inputs` olarak extract edildi

### Orta Vadeli (Kalite)
4. **Integration testler** — Credential reveal, auth, customer workflow (`%80 hedef`)
5. **CI/CD pipeline** — GitHub Actions PR check (build + test + format)

### Uzun Vadeli (Altyapı)
6. **AD/OIDC entegrasyonu** — `Sprint 9` ana görevi (hibrit auth)
7. **Production Docker Compose** — Nginx SSL, volume'lar, restart policy
8. **Database index optimizasyonu** — Yük testinden sonra
9. **Kullanıcı / Admin kılavuzu** — Dokümantasyon

---

## Seed Data (Geliştirme Ortamı)

`scripts/seed-dev.sh` ile aşağıdaki test verisi oluşturulur (henüz yazılmadı):

```
Roller: 5 sistem rolü
Ortam Tipleri: Development, Test, UAT, Production
Kaynak Tipleri: PostgreSQL, MSSQL, Oracle, Redis, RabbitMQ, Kafka, REST API, gRPC

Ekipler:
  - Payment Domain Team (domain, 4 kişi)
  - Auth Domain Team (domain, 3 kişi)
  - Mobile Project Team (project, 5 kişi)

Kişiler: 15 kişi (farklı rollerde, bazıları birden fazla ekipte)

Ürünler:
  - Ödeme Sistemi (CustomerBased) — Payment Domain
  - Auth Servisi (SaaS) — Auth Domain
  - Mobil Cüzdan (Hybrid)

Müşteriler:
  - ACME Corp (Active, Dedicated kurulum)
  - Beta Holding (Onboarding)
  - Gamma A.Ş. (Churned, arşivlenmiş)

Ortamlar (ACME Corp için):
  - Test: Ödeme Sistemi + kaynak bilgileri (dummy)
  - Production: Ödeme Sistemi + kaynak bilgileri (dummy şifreli)
```

---

## Teknoloji Karar Gerekçeleri (Özet)

| Karar | Seçim | Neden |
|-------|-------|-------|
| Architecture | Clean + CQRS (monolit) | 100 user → monolit yeterli, servis çıkarmak kolay |
| ORM | EF Core + Dapper | EF basit CRUD, Dapper karmaşık sorgular |
| DB | PostgreSQL | JSONB custom fields için ideal |
| Mapping | Mapster | Source-generated, hızlı, sade |
| Validation | FluentValidation | Güçlü, pipeline behavior ile otomatik |
| Error | ErrorOr | Railway-oriented, temiz handler kodu |
| Frontend | Angular 18 | Kurumsal, PrimeNG ekosistemi |
| UI Library | PrimeNG | DataTable, TreeTable hazır kurumsal bileşenler |
| State | NgRx | Büyük app, çoklu modül, predictable state |
| Auth | JWT + BCrypt | Standart, test edilebilir |
| Encryption | AES-256-CBC | Credential güvenliği için kanıtlanmış |
| Logging | Serilog | Structured logging, sink çeşitliliği |
