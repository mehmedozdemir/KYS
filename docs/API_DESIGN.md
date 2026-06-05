# API_DESIGN.md — KYS Platform API Tasarım Standartları

---

## Genel Prensipler

### URL Yapısı
```
/api/v{version}/{resource}
/api/v{version}/{resource}/{id}
/api/v{version}/{resource}/{id}/{sub-resource}

Örnekler:
GET  /api/v1/customers
GET  /api/v1/customers/{id}
GET  /api/v1/customers/{id}/products
GET  /api/v1/customers/{id}/environments
POST /api/v1/customers/{id}/archive
GET  /api/v1/products/{id}/endpoints
GET  /api/v1/credentials/{id}/reveal      ← özel endpoint, audit log yazar
```

**Kurallar:**
- URL'ler lowercase, kebab-case: `/knowledge-base` değil `/knowledgeBase`
- Resource adları çoğul: `/customers` değil `/customer`
- Alt kaynak ilişkisi için nested URL: `/customers/{id}/environments`
- Aksiyon fiilleri sadece gerçek REST eşlenmesi yoksa: `/archive`, `/restore`, `/reveal`
- Query string: filtreleme, sıralama, sayfalama için
- Asla URL'de şifre veya token olmaz

---

### HTTP Metotları

```
GET    → Okuma, idempotent
POST   → Oluşturma, yeni kaynak
PUT    → Tam güncelleme (nadiren — genelde PATCH tercih edilir)
PATCH  → Kısmi güncelleme
DELETE → Silme (soft delete — fiziksel değil)
```

---

### HTTP Status Kodları

```
200 OK              → Başarılı GET, PATCH, PUT
201 Created         → Başarılı POST (Location header ile)
204 No Content      → Başarılı DELETE
400 Bad Request     → Validasyon hatası, hatalı format
401 Unauthorized    → Token yok veya geçersiz
403 Forbidden       → Token geçerli ama yetki yok
404 Not Found       → Kayıt bulunamadı
409 Conflict        → Çakışma (duplicate code, vb.)
422 Unprocessable   → Semantik validasyon hatası (iş kuralı)
429 Too Many Req    → Rate limit aşıldı
500 Internal Error  → Beklenmeyen hata (detay loglanır, client'a verilmez)
```

---

### Response Formatları

#### Başarılı Tekil Kayıt
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "ACME Corp",
  "code": "ACME",
  "status": "Active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-06-01T08:00:00Z"
}
```

#### Başarılı Liste (Sayfalı)
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 247,
    "totalPages": 13,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### Hata Response (RFC 7807 ProblemDetails)
```json
{
  "type": "https://kys.example.com/errors/validation",
  "title": "Validasyon hatası",
  "status": 400,
  "detail": "Bir veya daha fazla alan geçersiz.",
  "instance": "/api/v1/customers",
  "traceId": "00-abc123-def456-00",
  "errors": {
    "code": ["Bu kod zaten kullanımda."],
    "email": ["Geçerli bir e-posta adresi giriniz."]
  }
}
```

#### Credential Reveal Response
```json
{
  "resourceId": "3fa85f64...",
  "fieldKey": "password",
  "value": "s3cr3tP@ssw0rd",
  "revealedAt": "2024-06-01T14:22:00Z",
  "expiresAt": "2024-06-01T14:27:00Z"
}
```

---

### Ortak Query Parametreleri (Listeleme)

```
page          int    default: 1
pageSize      int    default: 20, max: 100
sortBy        string field adı (camelCase)
sortOrder     string "asc" | "desc"
search        string genel metin araması
isArchived    bool   default: false (arşivlenmiş kayıtlar dahil edilsin mi)

Örnekler:
GET /api/v1/customers?page=2&pageSize=20&sortBy=name&sortOrder=asc&search=acme
GET /api/v1/customers?status=Active&isArchived=false
GET /api/v1/people?teamId={uuid}&employmentStatus=Active
```

---

## Endpoint Kataloğu

### Auth
```
POST   /api/v1/auth/login
       Body: { "username": "...", "password": "..." }
       Response: { "accessToken": "...", "refreshToken": "...", "expiresAt": "..." }

POST   /api/v1/auth/refresh
       Body: { "refreshToken": "..." }

POST   /api/v1/auth/logout
       Body: { "refreshToken": "..." }

GET    /api/v1/auth/me
       Response: { "id": "...", "name": "...", "permissions": [...] }
```

---

### Customers
```
GET    /api/v1/customers
       Query: page, pageSize, sortBy, search, status, isArchived

GET    /api/v1/customers/{id}
       Response: CustomerDetailDto (ürünler, ortamlar dahil)

POST   /api/v1/customers
       Body: CreateCustomerRequest

PATCH  /api/v1/customers/{id}
       Body: UpdateCustomerRequest

PATCH  /api/v1/customers/{id}/status
       Body: { "status": "Active", "note": "..." }

POST   /api/v1/customers/{id}/archive
       Body: { "serviceEndedAt": "2024-12-31", "churnReason": "..." }

POST   /api/v1/customers/{id}/restore
       (arşivden geri alma)

GET    /api/v1/customers/{id}/products
       (müşterinin ürünleri)

POST   /api/v1/customers/{id}/products
       Body: AddProductToCustomerRequest

GET    /api/v1/customers/{id}/environments
       (müşterinin ortamları, ürünleri ve kaynakları ile birlikte)
```

---

### Products
```
GET    /api/v1/products
       Query: page, pageSize, search, status, type, teamId

GET    /api/v1/products/{id}

POST   /api/v1/products

PATCH  /api/v1/products/{id}

GET    /api/v1/products/{id}/endpoints
       (ürünün frontend ve backend uçları)

POST   /api/v1/products/{id}/endpoints

PATCH  /api/v1/products/{id}/endpoints/{endpointId}

DELETE /api/v1/products/{id}/endpoints/{endpointId}

GET    /api/v1/products/{id}/teams
       (ürünün ekipleri)

GET    /api/v1/products/{id}/assignments
       (ürün üzerinde çalışan kişiler)

POST   /api/v1/products/{id}/assignments

GET    /api/v1/products/{id}/resource-templates
       (ürünün kaynak şablonları)

POST   /api/v1/products/{id}/resource-templates
```

---

### Teams
```
GET    /api/v1/teams
GET    /api/v1/teams/{id}
POST   /api/v1/teams
PATCH  /api/v1/teams/{id}

GET    /api/v1/teams/{id}/members
       Query: isActive=true
       Response: [{ person, role, startedAt, endedAt }]

POST   /api/v1/teams/{id}/members
       Body: { "personId": "...", "teamRole": "Member", "startedAt": "..." }

PATCH  /api/v1/teams/{id}/members/{membershipId}
       Body: { "endedAt": "...", "endReason": "..." }

GET    /api/v1/teams/{id}/products
```

---

### People
```
GET    /api/v1/people
       Query: teamId, employmentStatus, isPlatformUser

GET    /api/v1/people/{id}
       Response: PersonDetailDto (ekip üyelikleri, ürün atamaları, sistem rolleri)

POST   /api/v1/people

PATCH  /api/v1/people/{id}

PATCH  /api/v1/people/{id}/employment-status
       Body: { "status": "Resigned", "terminationDate": "2024-12-31" }

GET    /api/v1/people/{id}/team-history
       Response: tüm ekip geçmişi

POST   /api/v1/people/{id}/system-roles
       Body: { "roleId": "..." }

DELETE /api/v1/people/{id}/system-roles/{roleId}
```

---

### Environments
```
GET    /api/v1/environment-types
POST   /api/v1/environment-types
PATCH  /api/v1/environment-types/{id}

GET    /api/v1/customers/{customerId}/environments
       Response: ortam listesi (her birinde kaynaklar ve endpoint'ler)

GET    /api/v1/customers/{customerId}/environments/{envId}
       Response: ortam detayı (kaynaklar, endpoint URL'leri)

POST   /api/v1/customers/{customerId}/environments
       Body: { "environmentTypeId": "...", "name": "..." }

PATCH  /api/v1/customers/{customerId}/environments/{envId}
```

---

### Resources
```
GET    /api/v1/resource-types
GET    /api/v1/resource-types/{id}
       Response: kaynak tipi + field_schema (hangi alanlar tanımlanabilir)

POST   /api/v1/resource-types
PATCH  /api/v1/resource-types/{id}

GET    /api/v1/shared-resources
POST   /api/v1/shared-resources
PATCH  /api/v1/shared-resources/{id}

-- Ortam içindeki kaynaklar
GET    /api/v1/environments/{envId}/resources
POST   /api/v1/environments/{envId}/resources
PATCH  /api/v1/environments/{envId}/resources/{resourceId}
```

---

### Credentials (Şifreli Erişim)
```
-- Şifre GÜNCELLEMEsi (değeri görmez, sadece yazar)
PUT    /api/v1/credentials/{resourceId}/fields/{fieldKey}
       Permission: resources.credentials.reveal
       Body: { "value": "yeni_şifre" }
       Response: 204

-- Şifre GÖRÜNTÜLEME (audit log yazar)
GET    /api/v1/credentials/{resourceId}/fields/{fieldKey}/reveal
       Permission: resources.credentials.reveal
       Response: { "value": "...", "revealedAt": "..." }
       [Her çağrı audit_logs'a CredentialRevealed olarak kaydedilir]
```

---

### Customer Environment Endpoints
```
GET    /api/v1/environments/{envId}/endpoints
       Response: ortamdaki tüm endpoint URL'leri (frontend + tüm API'ler)

PUT    /api/v1/environments/{envId}/endpoints/{productEndpointId}
       Body: { "baseUrl": "...", "swaggerUrl": "...", "authType": "..." }
```

---

### Knowledge Base
```
GET    /api/v1/knowledge-base
       Query: productId, customerId, teamId, tags, search, visibility

GET    /api/v1/knowledge-base/{id}

POST   /api/v1/knowledge-base
       Body: { "title": "...", "content": "..." (Markdown), "productId": "...", "tags": [...] }

PATCH  /api/v1/knowledge-base/{id}

DELETE /api/v1/knowledge-base/{id}

GET    /api/v1/knowledge-base/tags
POST   /api/v1/knowledge-base/tags
```

---

### Admin
```
-- Custom Fields
GET    /api/v1/admin/custom-fields?entityType=Customer
POST   /api/v1/admin/custom-fields
PATCH  /api/v1/admin/custom-fields/{id}
DELETE /api/v1/admin/custom-fields/{id}

-- Audit Log
GET    /api/v1/admin/audit-logs
       Query: entityType, entityId, changedBy, from, to, action

-- Platform Users
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PATCH  /api/v1/admin/users/{id}
POST   /api/v1/admin/users/{id}/reset-password
POST   /api/v1/admin/users/{id}/unlock
```

---

## Request/Response DTO Standartları

### Naming Convention
```csharp
// Request DTO'ları
CreateCustomerRequest
UpdateCustomerRequest
ArchiveCustomerRequest
AddProductToCustomerRequest

// Response DTO'ları
CustomerListDto         ← liste için (az alan)
CustomerDetailDto       ← detay için (tüm alanlar + ilişkiler)
CustomerCreatedResponse ← sadece POST sonrası dönen (id + temel bilgi)
```

### DTO Tasarım Kuralları
1. `Id` alanı her response'da bulunur
2. Tarihler ISO 8601 format: `"2024-06-01T14:22:00Z"`
3. Enum değerleri string olarak döner: `"Active"` değil `1`
4. Null alanlar response'da dahil edilir (`null`) — absent değil
5. Liste içi DTO'lar minimal: sadece listede gösterilecek alanlar
6. Şifreli alanlar response'da `null` döner (reveal endpoint'i ayrı)
7. JSONB custom_fields her zaman döner: `"customFields": {}`

### Örnek: CustomerDetailDto
```json
{
  "id": "uuid",
  "name": "ACME Corp",
  "code": "ACME",
  "shortName": "ACME",
  "status": "Active",
  "sector": "Perakende",
  "country": "Türkiye",
  "city": "İzmir",
  "onboardingStartedAt": "2024-01-10",
  "testEnvReadyAt": "2024-02-01",
  "prodEnvReadyAt": "2024-02-15",
  "productionLiveAt": "2024-03-01",
  "primaryContact": {
    "name": "Ali Veli",
    "email": "ali@acme.com",
    "phone": "+90 232 123 4567"
  },
  "products": [
    {
      "productId": "uuid",
      "productName": "Ödeme Sistemi",
      "usageMode": "Dedicated",
      "status": "Active",
      "goLiveAt": "2024-03-01"
    }
  ],
  "customFields": {
    "erp_code": "C-10042",
    "region": "Ege"
  },
  "createdAt": "2024-01-10T09:00:00Z",
  "updatedAt": "2024-05-15T11:30:00Z"
}
```

---

## Güvenlik Header'ları (Tüm Response'larda)

```csharp
// Program.cs'de eklenir
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "no-referrer");
    context.Response.Headers.Add("Permissions-Policy", "geolocation=(), microphone=()");
    await next();
});
```

---

## Rate Limiting

```csharp
// Program.cs
builder.Services.AddRateLimiter(options =>
{
    // Genel API: 100 istek/dakika/kullanıcı
    options.AddUserBasedLimiter("api", new TokenBucketRateLimiterOptions
    {
        TokenLimit = 100,
        ReplenishmentPeriod = TimeSpan.FromMinutes(1),
        TokensPerPeriod = 100
    });

    // Credential reveal: 10 istek/dakika/kullanıcı
    options.AddUserBasedLimiter("credential-reveal", new TokenBucketRateLimiterOptions
    {
        TokenLimit = 10,
        ReplenishmentPeriod = TimeSpan.FromMinutes(1),
        TokensPerPeriod = 10
    });

    // Login: 5 başarısız/10 dakika/IP
    options.AddPolicy("login", ...);
});
```

---

## API Versioning Kuralları

```
v1: İlk yayın
v2: Breaking change gerekince (v1 en az 6 ay daha desteklenir)

Breaking change örnekleri:
- Alan adı değişimi
- Alan kaldırma
- Zorunlu alan ekleme
- Tip değişimi

Non-breaking (patch):
- İsteğe bağlı alan ekleme
- Bug fix
- Performans iyileştirmesi
```

---

## CORS Politikası

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("KysPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",   // Angular dev
                "https://kys.sirket.com"  // production
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
```

---

## Swagger / OpenAPI

- Her endpoint XML comment ile belgelenir
- Tüm response tipleri `[ProducesResponseType]` ile tanımlanır
- Auth header Swagger UI'da "Authorize" butonu ile test edilebilir
- Credential endpoint'leri ⚠️ etiketi ile işaretlenir

```csharp
/// <summary>
/// Müşteri oluşturur. Yetki: customers.create
/// </summary>
/// <param name="request">Müşteri oluşturma isteği</param>
/// <response code="201">Oluşturuldu</response>
/// <response code="400">Validasyon hatası</response>
/// <response code="409">Kod zaten kullanımda</response>
[HttpPost]
[ProducesResponseType(typeof(CustomerCreatedResponse), 201)]
[ProducesResponseType(typeof(ProblemDetails), 400)]
[ProducesResponseType(typeof(ProblemDetails), 409)]
public async Task<IActionResult> Create(...)
```
