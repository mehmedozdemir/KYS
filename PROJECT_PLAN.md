# PROJECT_PLAN.md — KYS Platform Geliştirme Planı

**Sürüm:** 1.0
**Hedef:** Web tabanlı kurumsal yazılım yönetim platformu
**Stack:** ASP.NET Core 10 + Angular 18 + PostgreSQL 16

---

## Proje Hedefleri

- 500 kişilik yazılım şirketinde 100+ eş zamanlı kullanıcı
- Müşteri, ürün, ekip, ortam ve kaynak bilgilerini merkezi yönetmek
- Kritik erişim bilgilerini (şifreli) güvenle saklamak ve yetkili kişilere sunmak
- Şema değişikliği gerektirmeden dinamik alan ekleyebilmek
- AD entegrasyonuna hazır mimari

---

## Faz Planı

```
Faz 1 (Sprint 0-3): Temel Altyapı + Organizasyon + Ürün  [~6 hafta]
Faz 2 (Sprint 4-6): Müşteri + Ortam + Kaynak             [~6 hafta]
Faz 3 (Sprint 7-8): Dashboard + UX Polishing              [~4 hafta]
Faz 4 (Sprint 9):   Knowledge Base + Admin                [~2 hafta]
Faz 5 (Sprint 10):  AD Entegrasyonu + Güvenlik Sertleme   [~2 hafta]
```

---

## Sprint 0 — Proje İskeleti ve Altyapı

**Süre:** 1 hafta
**Amaç:** Sıfırdan çalışan bir proje iskeleti; hiç özellik yok ama her şey doğru yapılandırılmış.

### Backend Görevleri

- [ ] Solution yapısı: `Kys.sln`, 4 proje (Domain, Application, Infrastructure, Api)
- [ ] `Directory.Build.props`: nullable, implicit usings, warnings as errors, analyzers
- [ ] `global.json`: .NET 10 SDK sürümü pin'lendi
- [ ] EF Core + Npgsql kurulum + `AppDbContext`
- [ ] `BaseEntity`, `AuditableEntity`, `ISoftDelete` base class'ları
- [ ] Soft delete interceptor (`SaveChangesInterceptor`)
- [ ] Timestamp interceptor (updated_at otomatik)
- [ ] Audit log interceptor (temel yapı)
- [ ] JWT authentication + refresh token altyapısı
- [ ] `ICurrentUserService` + implementasyonu
- [ ] `IEncryptionService` + AES-256-CBC implementasyonu
- [ ] Global exception handler (RFC 7807 ProblemDetails)
- [ ] Correlation ID middleware
- [ ] Serilog yapılandırması
- [ ] Swagger/OpenAPI yapılandırması (versioning ile)
- [ ] Health check endpoint'leri (`/health/live`, `/health/ready`)
- [ ] Rate limiting altyapısı
- [ ] CORS yapılandırması
- [ ] `Program.cs` composition root (layer extension methods)

### Infrastructure Görevleri

- [ ] `docker-compose.yml`: PostgreSQL, uygulama container'ı
- [ ] `Dockerfile.api`: multi-stage build, non-root kullanıcı
- [ ] `.env.example`: tüm environment variable'lar belgelenmiş
- [ ] `.gitignore`: kapsamlı, .env dahil
- [ ] `scripts/db-migrate.sh`
- [ ] `scripts/seed-dev.sh` (geliştirme ortamı seed verisi)

### Frontend Görevleri

- [ ] Angular 18 standalone project oluşturma (`ng new kys-ui --standalone`)
- [ ] PrimeNG 17 kurulum ve tema yapılandırması (Aura tema, özelleştirilmiş)
- [ ] NgRx store kurulum (auth slice)
- [ ] CSS variables (`_variables.scss`) — tasarım sisteminin tamamı
- [ ] HTTP interceptor (JWT token ekleme + 401 → logout)
- [ ] Auth guard + permission guard
- [ ] Shell layout (sidebar + topbar)
- [ ] Lazy loaded routing yapısı
- [ ] Shared component'ler: `PageHeaderComponent`, `EmptyStateComponent`

### CI/CD Görevleri

- [ ] `.github/workflows/pr.yml`: build + test + format
- [ ] `.github/pull_request_template.md`
- [ ] Pre-commit hook (gizli veri tarama + format)

### Mimari Testler

- [ ] `Kys.Architecture.Tests` projesi oluşturma (NetArchTest)
- [ ] Domain → Infrastructure bağımlılık yasağı testi
- [ ] Controller → business logic yasağı testi
- [ ] Entity → API response yasağı testi

**Kabul Kriterleri:**
- `docker-compose up` ile uygulama ayağa kalkar
- `/health/live` 200 döner
- `/swagger` açılır
- Angular `ng serve` çalışır
- Tüm testler yeşil
- CI pipeline yeşil

---

## Sprint 1 — Identity & Organization Modülü

**Süre:** 1.5 hafta

### Backend

**People (Kişi Yönetimi)**
- [ ] `Person` entity + EF Core configuration
- [ ] `PersonRepository` (IPersonRepository + implementasyon)
- [ ] Queries: `GetPeople`, `GetPersonDetail`
- [ ] Commands: `CreatePerson`, `UpdatePerson`, `UpdateEmploymentStatus`
- [ ] Validators tümü için
- [ ] `PeopleController` (GET list, GET detail, POST, PATCH, PATCH status)
- [ ] Login endpoint (Auth) + JWT üretimi + refresh token
- [ ] `GET /api/v1/auth/me` endpoint'i

**System Roles & Permissions**
- [ ] `SystemRole` entity + seed data (5 rol)
- [ ] `PersonSystemRole` entity
- [ ] Permission-based authorization middleware
- [ ] `RequirePermissionAttribute` + handler
- [ ] `GET/POST/DELETE /api/v1/admin/users/{id}/system-roles`

**Teams (Ekip Yönetimi)**
- [ ] `Team`, `OrganizationRole`, `TeamMembership` entity'leri
- [ ] Repository'ler
- [ ] Queries: `GetTeams`, `GetTeamDetail`, `GetTeamMembers`, `GetPersonTeamHistory`
- [ ] Commands: `CreateTeam`, `UpdateTeam`, `AddTeamMember`, `EndTeamMembership`
- [ ] `TeamsController` + endpoints
- [ ] `PeopleController`'a team membership endpoint'leri ekleme

### Frontend

- [ ] Auth feature: login sayfası (form, validasyon, hata mesajları)
- [ ] NgRx auth state: login, logout, token refresh, permissions
- [ ] People feature:
  - [ ] Kişi listesi sayfası (DataTable, search, filtre)
  - [ ] Kişi detay sayfası (genel bilgi, ekip geçmişi, sistem rolleri)
  - [ ] Kişi oluşturma/düzenleme modal
  - [ ] Employment status değiştirme
- [ ] Teams feature:
  - [ ] Ekip listesi sayfası
  - [ ] Ekip detay sayfası (üyeler, ürünler)
  - [ ] Ekip oluşturma/düzenleme modal
  - [ ] Üye ekleme / üyelik bitirme işlemi

### Testler
- [ ] `CreatePersonCommandHandler` unit test
- [ ] `AddTeamMemberCommandHandler` unit test (üyelik tarihçe kuralı)
- [ ] `PeopleController` integration test (GET, POST, PATCH)
- [ ] `TeamsController` integration test

**Kabul Kriterleri:**
- Admin login yapabilir
- Kişi oluşturulabilir, düzenlenebilir, ekibe eklenebilir
- Ekip üyesi başka ekibe geçince tarihçe kaydı oluşur

---

## Sprint 2 — Product Modülü

**Süre:** 1.5 hafta

### Backend

- [ ] `Product`, `ProductTeam`, `ProductAssignment` entity'leri
- [ ] `ProductEndpoint`, `ProductResourceTemplate` entity'leri
- [ ] Repository'ler
- [ ] Queries: `GetProducts`, `GetProductDetail`, `GetProductEndpoints`, `GetProductAssignments`, `GetProductResourceTemplates`
- [ ] Commands: `CreateProduct`, `UpdateProduct`, `AssignTeamToProduct`, `AssignPersonToProduct`, `CreateProductEndpoint`, `UpdateProductEndpoint`, `DeleteProductEndpoint`, `CreateProductResourceTemplate`
- [ ] `ProductsController` + tüm endpoints

### Frontend

- [ ] Product listesi sayfası (tip filtreleri: SaaS/CustomerBased/Hybrid)
- [ ] Product detay sayfası:
  - [ ] Genel bilgi tab'ı (PO, ekip, durum, tech stack)
  - [ ] Endpoint'ler tab'ı (frontend + API listesi)
  - [ ] Çalışanlar tab'ı (aktif atamalar)
  - [ ] Kaynak şablonları tab'ı
- [ ] Product oluşturma/düzenleme modal (multi-step form)
- [ ] Endpoint yönetimi (ekle, düzenle, sil)
- [ ] Kaynak şablonu yönetimi

### Testler
- [ ] `CreateProductCommandHandler` unit test
- [ ] `ProductsController` integration test

---

## Sprint 3 — Custom Fields Modülü

**Süre:** 1 hafta

### Backend

- [ ] `CustomFieldDefinition` entity + repository
- [ ] `CustomFieldValidatorService` (JSONB field validation engine)
- [ ] Queries: `GetCustomFieldDefinitions` (entity_type bazlı)
- [ ] Commands: `CreateCustomFieldDefinition`, `UpdateCustomFieldDefinition`, `ToggleCustomFieldDefinition`
- [ ] `CustomFieldBehavior` (MediatR pipeline behavior — her create/update command'da otomatik validate)
- [ ] `Admin/CustomFieldsController`

### Frontend

- [ ] Admin → Özel Alanlar sayfası:
  - [ ] Müşteri alanları listesi
  - [ ] Ürün alanları listesi
  - [ ] Alan oluşturma (tip seçimi, validasyon kuralları, dropdown seçenekleri)
  - [ ] Alan sıralama (drag & drop)
- [ ] `CustomFieldInputComponent` (tipe göre dinamik input render)
- [ ] `CustomFieldGroupComponent` (gruplandırılmış görünüm)
- [ ] Customer ve Product formlarına custom fields entegrasyonu

### Testler
- [ ] `CustomFieldValidatorService` unit test (her tip için)
- [ ] Required field eksik → validation error testi
- [ ] Invalid select option → validation error testi

---

## Sprint 4 — Customer Modülü

**Süre:** 1.5 hafta

### Backend

- [ ] `Customer`, `CustomerProduct` entity'leri
- [ ] Repository'ler
- [ ] Queries: `GetCustomers`, `GetCustomerDetail`, `GetCustomerProducts`
- [ ] Commands: `CreateCustomer`, `UpdateCustomer`, `UpdateCustomerStatus`, `ArchiveCustomer`, `RestoreCustomer`, `AddProductToCustomer`, `UpdateCustomerProductStatus`
- [ ] Archive business rule: `service_ended_at` zorunlu, `is_archived = true`
- [ ] `CustomersController` + tüm endpoints

### Frontend

- [ ] Customer listesi sayfası:
  - [ ] Status badge'leri (renkli)
  - [ ] Arama, status filtresi, arşiv toggle
  - [ ] Tablo: ad, kod, durum, ürün sayısı, go-live tarihi
- [ ] Customer detay sayfası:
  - [ ] Header kartı (durum, tarihler)
  - [ ] Genel Bilgiler tab'ı (+ custom fields)
  - [ ] Ürünler tab'ı (ürün kartları, kullanım modeli badge'i)
- [ ] Customer oluşturma/düzenleme modal
- [ ] Status değiştirme akışı (lifecycle adımları)
- [ ] Archive modal (tarih + sebep formu, onay dialog)
- [ ] Ürün ekleme modal (SaaS vs Dedicated seçimi)

### Testler
- [ ] `ArchiveCustomerCommandHandler` unit test
- [ ] `CustomersController` integration test

---

## Sprint 5 — Environment & Resource Modülü

**Süre:** 2 hafta (en karmaşık sprint)

### Backend

- [ ] `EnvironmentType`, `CustomerEnvironment` entity'leri
- [ ] `ResourceType`, `SharedResource`, `ProductSharedResource` entity'leri
- [ ] `EnvironmentResource` entity'si
- [ ] `ResourceCredential` entity'si (şifreli)
- [ ] `CustomerEnvironmentEndpoint` entity'si
- [ ] Repository'lerin tümü
- [ ] Queries: `GetEnvironmentTypes`, `GetCustomerEnvironments`, `GetEnvironmentDetail` (kaynaklar + endpoint URL'leri dahil), `GetResourceTypes`, `GetSharedResources`
- [ ] Commands: `CreateEnvironmentType`, `CreateCustomerEnvironment`, `CreateResourceType`, `CreateSharedResource`, `AddResourceToEnvironment`, `UpdateEnvironmentResource`, `SetEnvironmentEndpointUrl`
- [ ] `EnvironmentsController`
- [ ] `ResourcesController`
- [ ] Credential management:
  - [ ] `SetCredential` command (şifreli kaydetme)
  - [ ] `RevealCredential` handler (şifre çözme + audit log)
  - [ ] `CredentialsController`
  - [ ] `ResourceAuthorizationService` (resource-level auth)

### Frontend

- [ ] Environment Types yönetim sayfası (admin)
- [ ] Resource Types yönetim sayfası (admin, field schema editörü)
- [ ] Shared Resources yönetim sayfası
- [ ] Customer detay → **Ortamlar & Kaynaklar tab'ı** (en kritik ekran):
  - [ ] Ortam sekme navigasyonu (renkli)
  - [ ] Production ortamı uyarı banner'ı (kırmızı)
  - [ ] Ürün accordion'ları
  - [ ] `CopyableUrlComponent` (URL + kopyala + yeni sekme aç)
  - [ ] `CredentialCellComponent` (şifreli değer + göster + kopyala)
  - [ ] Endpoint URL düzenleme inline
  - [ ] Kaynak ekleme (şablondan seçme)
  - [ ] Credential güncelleme modal
- [ ] Shared resource gösterimi (`[PAYLAŞIMLI]` badge'i)

### Testler
- [ ] `AesEncryptionService` unit test (encrypt/decrypt round-trip)
- [ ] `RevealCredentialHandler` unit test (yetki kontrolü + audit log)
- [ ] `ResourceAuthorizationService` unit test (developer sadece kendi ürünleri)
- [ ] `CredentialsController` integration test:
  - [ ] Yetkisiz kullanıcı reveal → 403
  - [ ] Yetkili kullanıcı reveal → 200 + audit log kaydı

---

## Sprint 6 — Dashboard & Arama

**Süre:** 1 hafta

### Backend

- [ ] Dashboard query: özet istatistikler (aktif müşteri sayısı, ürün sayısı, ekip sayısı)
- [ ] Dashboard query: son aktiviteler (audit log'dan)
- [ ] Global arama endpoint: `GET /api/v1/search?q=...` → müşteri + ürün + KB makalesi

### Frontend

- [ ] Dashboard sayfası:
  - [ ] Özet metrik kartları (müşteri, ürün, ekip sayıları)
  - [ ] Son güncellenen müşteriler listesi
  - [ ] Son aktiviteler (audit log timeline)
  - [ ] Hızlı linkler
- [ ] Global arama (topbar search):
  - [ ] Debounced 400ms
  - [ ] Kategori bazlı sonuçlar (Müşteriler / Ürünler / Makaleler)
  - [ ] Sonuca tıklama → ilgili sayfaya git

---

## Sprint 7 — Knowledge Base Modülü

**Süre:** 1 hafta

### Backend

- [ ] `KbArticle`, `KbTag`, `KbArticleTag` entity'leri
- [ ] Full-text search (PostgreSQL tsvector, Türkçe)
- [ ] Queries: `GetArticles`, `GetArticleDetail`, `GetTags`
- [ ] Commands: `CreateArticle`, `UpdateArticle`, `DeleteArticle`
- [ ] `KnowledgeBaseController`

### Frontend

- [ ] KB listesi sayfası:
  - [ ] Tag filtresi
  - [ ] Bağlam filtresi (ürün / müşteri bazlı)
  - [ ] Arama (full-text)
  - [ ] Görünürlük badge'leri
- [ ] KB detay sayfası:
  - [ ] Markdown render (marked.js)
  - [ ] Düzenle butonu (yazar veya admin)
  - [ ] Etiketler
  - [ ] İlgili kayıtlar (ürün, müşteri linki)
- [ ] KB oluşturma/düzenleme:
  - [ ] Markdown editör (split view: editör + önizleme)
  - [ ] Bağlam seçimi (ürün, müşteri, ekip)
  - [ ] Etiket seçimi (autocomplete, yeni etiket oluşturma)

---

## Sprint 8 — Admin Modülü & Audit Log

**Süre:** 1 hafta

### Backend

- [ ] `AuditLog` entity + repository
- [ ] Queries: `GetAuditLogs` (sayfalı, filtreli)
- [ ] `Admin/AuditLogController`
- [ ] `Admin/UsersController` (platform kullanıcı yönetimi):
  - [ ] Kullanıcı listesi, oluşturma, şifre sıfırlama, kilit açma
- [ ] Platform istatistikleri endpoint'i

### Frontend

- [ ] Admin modülü (PlatformAdmin'e özel):
  - [ ] Kullanıcılar sayfası (platform erişim yönetimi)
  - [ ] Rol ataması
  - [ ] Şifre sıfırlama, hesap kilidi açma
- [ ] Audit Log sayfası:
  - [ ] Filtreleme: entity tipi, kullanıcı, tarih aralığı, aksiyon
  - [ ] Timeline görünümü
  - [ ] `CredentialRevealed` kayıtları kırmızı ile vurgulanır
- [ ] Özel Alanlar sayfası (Sprint 3'ten taşınan UI polishing)

---

## Sprint 9 — AD Entegrasyonu & Güvenlik Sertleme

**Süre:** 1 hafta

### Backend

- [ ] OIDC middleware kurulumu (Microsoft.AspNetCore.Authentication.OpenIdConnect)
- [ ] AD kullanıcısı → Platform rol eşleme servisi
- [ ] Hibrit auth: Internal Identity OR AD (her ikisi aktif)
- [ ] `appsettings.json` → OIDC config bölümü
- [ ] Kullanıcı ilk AD girişinde otomatik person kaydı oluşturma
- [ ] Login endpoint: hangi provider kullanılacağını otomatik belirleme
- [ ] Revoked token cleanup background service

### Güvenlik Sertleme
- [ ] Penetration test checklist uygulama
- [ ] OWASP Top 10 kontrol
- [ ] Tüm endpoint'lerde yetki testi (otomatik)
- [ ] Rate limit stress testi
- [ ] Dependency vulnerability final audit

### Frontend
- [ ] "AD ile Giriş" butonu login sayfasına ekleme
- [ ] OIDC redirect akışı
- [ ] Session timeout uyarısı (token expire olmadan 2 dakika önce)

---

## Sprint 10 — Polish, Test & Go-Live Hazırlığı

**Süre:** 1 hafta

### Backend
- [ ] Integration test coverage > %80
- [ ] Load test: 100 eş zamanlı kullanıcı simülasyonu (k6 veya NBomber)
- [ ] Database index optimizasyonu (gerçek veri üzerinde EXPLAIN ANALYZE)
- [ ] PgBouncer yapılandırması (docker-compose.prod.yml)

### Frontend
- [ ] Angular production build optimizasyonu
- [ ] PWA manifest (opsiyonel)
- [ ] Error boundary (global hata yakalama)
- [ ] Accessibility audit (axe-core)
- [ ] Cross-browser test (Chrome, Firefox, Edge)

### DevOps
- [ ] `docker-compose.prod.yml`: tüm servisler, volume'lar, restart policy
- [ ] Nginx SSL yapılandırması
- [ ] `README.md`: production deployment rehberi
- [ ] Backup stratejisi dokümantasyonu

### Dokümantasyon
- [ ] API Swagger tam ve güncel
- [ ] `CHANGELOG.md` 1.0.0 sürümü
- [ ] Kullanıcı kılavuzu (temel operasyonlar)
- [ ] Admin kılavuzu (sistem yapılandırması)

---

## Seed Data (Geliştirme Ortamı)

`scripts/seed-dev.sh` ile aşağıdaki test verisi oluşturulur:

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

Özel Alanlar:
  - Customer: ERP Kodu, Bölge, Sözleşme Bitiş Tarihi
  - Product: Dokümantasyon URL, Jira Proje Kodu

KB Makaleleri: 5 örnek makale (farklı bağlamlarda)
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
