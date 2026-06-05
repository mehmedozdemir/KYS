# CLAUDE.md — KYS Platform (Kurumsal Yazılım Yönetim Sistemi)

Bu dosya Claude Code'un bu projeyi geliştirmesi için birincil talimat kaynağıdır.
Her görevde önce bu dosyayı, sonra ilgili `docs/` dosyasını oku.

---

## Projenin Özeti

KYS, 500+ kişilik bir yazılım şirketinin şu ihtiyaçlarını karşılayan **web tabanlı kurumsal yönetim platformudur:**

- Yazılım ürünlerini ve müşteri ilişkilerini takip etmek
- Ekipleri, ekip üyelerini ve rollerini yönetmek
- Her müşterideki ortam (environment) ve kaynak (resource) bilgilerini merkezi tutmak
- Erişim bilgilerini (şifreli) güvenle saklamak ve yetkili kişilere sunmak
- Ürün/müşteri bazlı bilgi tabanı tutmak
- Dinamik alan tanımları ile şema değişikliği gerektirmeden genişleyebilmek

---

## Teknoloji Stack'i

```
Backend  : ASP.NET Core 10, C# 13
ORM      : EF Core 10 + Dapper (karmaşık sorgular için)
Database : PostgreSQL 16 (JSONB kolonları ile)
Pattern  : Clean Architecture + CQRS (MediatR) + Repository
Auth     : ASP.NET Core Identity + JWT (Faz 2: OIDC/AD)
Frontend : Angular 18 (standalone components) + PrimeNG 17
Cache    : IMemoryCache (Faz 1) → Redis (Faz 2)
Logging  : Serilog → Seq veya Console (yapılandırılabilir)
Container: Docker + Docker Compose
Reverse  : Nginx
```

---

## Kritik Mimari Kurallar

Aşağıdaki kurallar tartışmasız uygulanır. Hiçbir "pratiklik" gerekçesiyle ihlal edilmez.

### 1. Katman Bağımlılık Kuralı (Dependency Rule)
```
Domain ← Application ← Infrastructure
Domain ← Application ← Api (Presentation)
```
- Domain hiçbir dış katmana bağımlı değildir
- Application sadece Domain'e bağımlıdır
- Infrastructure ve Api, Application interface'lerini implemente eder
- NetArchTest ile bu kural her PR'da otomatik test edilir

### 2. API → DTO Kuralı
- Hiçbir zaman domain entity doğrudan API response'u olarak dönmez
- Her endpoint'in kendi Request ve Response DTO'su vardır
- Mapster ile mapping yapılır (AutoMapper değil — daha hızlı, source-generated)

### 3. Controller Kuralı
```csharp
// DOĞRU — controller sadece dispatch eder
[HttpPost]
public async Task<IActionResult> Create(CreateProductRequest request, CancellationToken ct)
    => Ok(await _mediator.Send(request.ToCommand(), ct));

// YANLIŞ — controller'da iş mantığı
[HttpPost]
public async Task<IActionResult> Create(CreateProductRequest request)
{
    var product = new Product(request.Name); // ← Domain mantığı controller'da
    _db.Products.Add(product);
    await _db.SaveChangesAsync();
    return Ok(product);
}
```

### 4. Async Kuralı
- Her I/O operasyonu `async/await` kullanır
- `.Result` veya `.Wait()` kesinlikle yasaktır
- Her async metot `CancellationToken` parametresi alır

### 5. Şifre/Credential Kuralı
- `ResourceCredential` tablosundaki tüm hassas alanlar AES-256-CBC ile şifrelenir
- Şifreleme anahtarı environment variable'dan gelir, asla kod veya config'e yazılmaz
- API response'unda şifreli değer gösterilmez — her zaman `***` döner
- Açık değer sadece yetkili kullanıcı "Göster" butonuna bastığında, ayrı bir endpoint'ten alınır

### 6. JSONB / Dinamik Alan Kuralı
- `Customer.custom_fields` ve `Product.custom_fields` JSONB kolonlarıdır
- `CustomFieldDefinition` tablosu bu alanların şemasını tutar (ad, tip, validasyon)
- Runtime'da alan validasyonu `CustomFieldValidator` servisi tarafından yapılır
- EF Core `Owned Entity` değil, raw JSONB olarak işlenir

---

## Klasör Yapısı

```
kys-platform/
├── CLAUDE.md                    ← Bu dosya — her zaman önce oku
├── PROJECT_PLAN.md              ← Sprint planı ve görev detayları
├── README.md                    ← Proje kurulum rehberi
├── CHANGELOG.md
├── .env.example
├── .gitignore
│
├── docs/
│   ├── ARCHITECTURE.md          ← Mimari kararlar ve ADR'ler
│   ├── DATA_MODEL.md            ← Entity ilişkileri ve şema
│   ├── API_DESIGN.md            ← API kontrat standartları
│   ├── UI_UX_DESIGN.md          ← Angular UI/UX prensipleri
│   ├── SECURITY.md              ← Güvenlik gereksinimleri
│   └── GIT_WORKFLOW.md          ← Branch ve commit kuralları
│
├── src/
│   ├── backend/
│   │   ├── Kys.Domain/
│   │   ├── Kys.Application/
│   │   ├── Kys.Infrastructure/
│   │   └── Kys.Api/
│   │
│   └── frontend/
│       └── kys-ui/              ← Angular 18 projesi
│
├── tests/
│   ├── Kys.Domain.Tests/
│   ├── Kys.Application.Tests/
│   ├── Kys.Infrastructure.Tests/
│   ├── Kys.Api.Tests/
│   └── Kys.Architecture.Tests/
│
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.ui
│   └── docker-compose.yml
│
└── scripts/
    ├── db-migrate.sh
    ├── seed-dev.sh
    └── generate-certs.sh
```

---

## Görev Başlarken Yapılacaklar (Her Görev)

1. `CLAUDE.md` oku (bu dosya)
2. İlgili `docs/` dosyasını oku (ör. API değişikliği → `docs/API_DESIGN.md`)
3. `PROJECT_PLAN.md`'de hangi sprint/görevde olduğunu kontrol et
4. Yeni dosya/entity/endpoint ekliyorsan → önce `docs/DATA_MODEL.md`'e bak
5. Güvenlik gerektiren değişiklik → `docs/SECURITY.md`'e bak

---

## Paket Referansları (Onaylı Paketler)

### Backend
```xml
<!-- Core -->
<PackageReference Include="MediatR" Version="12.*" />
<PackageReference Include="FluentValidation.AspNetCore" Version="11.*" />
<PackageReference Include="Mapster" Version="7.*" />
<PackageReference Include="Mapster.DependencyInjection" Version="1.*" />
<PackageReference Include="ErrorOr" Version="1.*" />

<!-- EF Core + PostgreSQL -->
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.*" />
<PackageReference Include="EFCore.NamingConventions" Version="8.*" />
<PackageReference Include="Dapper" Version="2.*" />

<!-- Auth -->
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.*" />
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="10.*" />

<!-- Logging -->
<PackageReference Include="Serilog.AspNetCore" Version="8.*" />
<PackageReference Include="Serilog.Sinks.Console" Version="6.*" />
<PackageReference Include="Serilog.Sinks.File" Version="5.*" />

<!-- API -->
<PackageReference Include="Swashbuckle.AspNetCore" Version="7.*" />
<PackageReference Include="Asp.Versioning.Mvc" Version="8.*" />

<!-- Testing -->
<PackageReference Include="xunit" Version="2.*" />
<PackageReference Include="FluentAssertions" Version="6.*" />
<PackageReference Include="NSubstitute" Version="5.*" />
<PackageReference Include="NetArchTest.Rules" Version="1.*" />
<PackageReference Include="Respawn" Version="6.*" />
<PackageReference Include="Testcontainers.PostgreSql" Version="3.*" />
```

### Frontend (package.json)
```json
{
  "@angular/core": "^18.0.0",
  "@angular/router": "^18.0.0",
  "@angular/forms": "^18.0.0",
  "primeng": "^17.0.0",
  "primeicons": "^7.0.0",
  "@ngrx/store": "^18.0.0",
  "@ngrx/effects": "^18.0.0",
  "@ngrx/entity": "^18.0.0",
  "@ngrx/router-store": "^18.0.0",
  "rxjs": "^7.8.0",
  "marked": "^13.0.0"
}
```

---

## Uygulama Modülleri (Angular)

```
auth/           ← Login, token yönetimi, guard
dashboard/      ← Ana sayfa, özet kartları
customers/      ← Müşteri listesi, detay, lifecycle
products/       ← Ürün listesi, detay, endpoint yönetimi
teams/          ← Ekip yönetimi, üye atamaları
people/         ← Kişi listesi, profil, rol atamaları
environments/   ← Environment tanımları
resources/      ← Kaynak tipleri ve shared resource yönetimi
knowledge-base/ ← Makale listesi, detay, Markdown editör
admin/          ← Sistem yönetimi, custom field tanımları, audit log
shared/         ← Ortak component'ler, directive'ler, pipe'lar
core/           ← HTTP interceptor, auth guard, token service
```

---

## Test Stratejisi

```
Unit Tests (xUnit)
├── Domain: entity davranışları, value object'ler
├── Application: command/query handler'lar (mock repository ile)
└── Hedef coverage: %80 minimum

Integration Tests (WebApplicationFactory + Testcontainers)
├── Her endpoint için happy path
├── Auth gerektiren endpoint'ler → yetkisiz erişim testi
├── Şifreli veri endpoint'leri → yetki testi
└── Custom field validasyon testleri

Architecture Tests (NetArchTest)
├── Domain'in Infrastructure'a bağımlı olmadığı
├── Controller'ların business logic içermediği
└── Entity'lerin doğrudan API'den dönmediği
```

---

## Önemli İş Kuralları (Kod Yazarken Unutma)

1. **Müşteri arşivleme:** `Customer.Status = Churned` set edildiğinde `ChurnedAt` dolar, `IsArchived = true` olur. Arşivlenen müşteriler varsayılan listelerde görünmez.

2. **TeamMembership tarihçesi:** Ekip üyeliği değiştirmek → mevcut kaydın `EndDate`'ini set et, yeni kayıt oluştur. Eski kayıt silinmez.

3. **Hybrid ürün + müşteri:** `CustomerProduct.UsageMode` = `SaaS` ise o müşteri için environment ve kaynak tanımlanamaz. Sadece ilişki kaydı tutulur.

4. **Shared Resource erişimi:** Bir kaynak `SharedResource` ise, ona atanmış ürünlerin yetkili üyeleri erişebilir. Diğerleri göremez.

5. **Credential görüntüleme:** Şifreli credential `GET /api/v1/credentials/{id}/reveal` endpoint'inden, `CanViewCredentials` yetkisiyle alınır. Bu endpoint her çağrısı audit log'a yazılır.

6. **Custom Field validasyon:** Her entity kaydedilmeden önce, tanımlı `CustomFieldDefinition`'lara göre `custom_fields` JSONB alanı validate edilir. `is_required = true` alanlar zorunlu kontrol edilir.

7. **Soft delete:** Hiçbir kritik entity fiziksel olarak silinmez. `DeletedAt` ve `IsDeleted` kolonları ile soft delete uygulanır. EF Core global query filter ile tüm sorgularda silinmişler otomatik hariç tutulur.

8. **Audit log:** Her Create/Update/Delete işlemi `AuditLog` tablosuna yazılır. `ChangedBy`, `ChangedAt`, `EntityType`, `EntityId`, `OldValues`, `NewValues` (JSONB) tutulur.
