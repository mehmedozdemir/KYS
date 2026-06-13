# SECURITY.md — KYS Platform Güvenlik Gereksinimleri

---

## Güvenlik Seviyeleri

Bu platform üç tür hassas veri barındırır:

```
Seviye 1 — Genel bilgi (düşük risk)
  Müşteri adı, ürün listesi, ekip bilgisi
  → Oturum açmış her kullanıcı görebilir

Seviye 2 — Gizli iş bilgisi (orta risk)
  Müşteri lifecycle tarihleri, özel alanlar, KB makaleleri
  → Rol bazlı erişim (RBAC)

Seviye 3 — Kritik sistem erişim bilgileri (yüksek risk)
  Şifreler, API key'ler, token bilgileri, DB bağlantı stringleri
  → AES-256 şifreleme + özel yetki + audit log
```

---

## 1. Authentication

### JWT Token Yapısı

```json
{
  "header": { "alg": "HS256", "typ": "JWT" },
  "payload": {
    "sub": "uuid-person-id",
    "name": "Mehmet Yılmaz",
    "email": "mehmet@sirket.com",
    "permissions": ["customers.view", "products.view", "..."],
    "iat": 1717234800,
    "exp": 1717236600,     // 30 dakika
    "jti": "uuid-token-id" // token unique ID (revoke için)
  }
}
```

**Kurallar:**
- Access token: 30 dakika TTL
- Refresh token: 7 gün TTL, DB'de saklanır, tek kullanımlık (rotation)
- Token signing key: environment variable, minimum 256-bit
- Blacklist: logout olan token'lar `revoked_tokens` tablosunda saklanır
- JTI (JWT ID): her token'ın DB'de kaydı var → revoke edilebilir

### Şifre Politikası

```
Minimum 8 karakter
En az 1 büyük harf
En az 1 küçük harf
En az 1 rakam
En az 1 özel karakter
Son 5 şifre tekrar kullanılamaz
90 günde bir şifre değiştirme uyarısı (zorunlu değil, tavsiye)
```

### Brute Force Koruması

```csharp
// Login endpoint rate limit: 5 başarısız/10 dakika/IP
// 5 başarısız girişten sonra: hesap geçici kilitleme (15 dakika)
// 10 başarısız girişten sonra: kalıcı kilit (admin unlock gerekir)

// Lockout tracking
public class LoginResult {
    public bool IsSuccess { get; }
    public bool IsLocked { get; }
    public int FailedAttempts { get; }
    public DateTime? LockoutEnd { get; }
}
```

---

## 2. Authorization (RBAC)

### Permission Listesi

```csharp
public static class Permissions
{
    // Customers
    public const string CustomersView    = "customers.view";
    public const string CustomersCreate  = "customers.create";
    public const string CustomersEdit    = "customers.edit";
    public const string CustomersArchive = "customers.archive";

    // Products
    public const string ProductsView    = "products.view";
    public const string ProductsCreate  = "products.create";
    public const string ProductsEdit    = "products.edit";

    // Teams
    public const string TeamsView    = "teams.view";
    public const string TeamsManage  = "teams.manage";

    // People
    public const string PeopleView    = "people.view";
    public const string PeopleManage  = "people.manage";

    // Resources
    public const string ResourcesView               = "resources.view";
    public const string ResourcesEdit               = "resources.edit";
    public const string ResourcesCredentialsReveal  = "resources.credentials.reveal";

    // Knowledge Base
    public const string KbView   = "kb.view";
    public const string KbCreate = "kb.create";
    public const string KbEdit   = "kb.edit";

    // Admin
    public const string AdminCustomFields = "admin.customfields";
    public const string AdminAuditLog     = "admin.auditlog";
    public const string AdminUsers        = "admin.users";
    public const string AdminSystemRoles  = "admin.systemroles";
}
```

### Rol → Permission Matrisi

| Permission | PlatformAdmin | Director | TeamLead | Developer | ReadOnly |
|---|---|---|---|---|---|
| customers.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| customers.create | ✅ | ❌ | ❌ | ❌ | ❌ |
| customers.edit | ✅ | ❌ | ✅ | ❌ | ❌ |
| customers.archive | ✅ | ❌ | ❌ | ❌ | ❌ |
| resources.view | ✅ | ✅ | ✅ | ✅ | ❌ |
| resources.edit | ✅ | ❌ | ✅ | ❌ | ❌ |
| **resources.credentials.reveal** | ✅ | ❌ | ✅ | ✅* | ❌ |
| admin.* | ✅ | ❌ | ❌ | ❌ | ❌ |

> *Developer: sadece atandığı ürünlerin credential'larını görebilir
> **Kişisel Credential (personal_resource_credentials):** Sadece sahibi (`owner_person_id == currentUser`) reveal edebilir. Hiçbir rol bypass edemez.

| **personal-credential:manage** | ✅ | ❌ | ✅ | ❌ | ❌ |

> `personal-credential:manage`: PlatformAdmin ve TeamLead başkasının kişisel credential'ını **silebilir veya sıfırlayabilir** ama **açık değerini göremez**.

### Resource-Level Authorization

Sadece rol bazlı yetki yeterli değil — kaynak bazlı kontrol de şart:

```csharp
public class ResourceAuthorizationService
{
    // "Bu kişi bu paylaşımlı credential'ı görebilir mi?"
    public async Task<bool> CanRevealCredentialAsync(
        Guid personId,
        Guid environmentResourceId,
        CancellationToken ct)
    {
        // 1. resources.credentials.reveal yetkisi var mı?
        if (!await _permissionService.HasAsync(personId, Permissions.ResourcesCredentialsReveal, ct))
            return false;

        // 2. PlatformAdmin veya Director ise → evet
        if (await _permissionService.HasRoleAsync(personId, "PlatformAdmin", ct))
            return true;

        // 3. Developer/TeamLead: sadece atandığı ürünlerin ortamlarını görebilir
        return await _db.ProductAssignments
            .AnyAsync(pa =>
                pa.PersonId == personId &&
                pa.IsActive &&
                pa.Product.CustomerProducts
                    .Any(cp => cp.CustomerEnvironments
                        .Any(ce => ce.EnvironmentResources
                            .Any(er => er.Id == environmentResourceId))), ct);
    }

    // "Bu kişisel credential'ı sadece sahibi görebilir — HİÇBİR bypass yok"
    public bool CanRevealPersonalCredential(Guid ownerId, Guid currentUserId)
        => ownerId == currentUserId;
}
```

---

## 3. Credential Şifreleme

### AES-256-CBC Implementasyonu

```csharp
public class AesEncryptionService : IEncryptionService
{
    private readonly byte[] _key;

    public AesEncryptionService(IOptions<EncryptionOptions> options)
    {
        // Key: base64 encoded 32-byte string
        _key = Convert.FromBase64String(options.Value.Key);
        if (_key.Length != 32)
            throw new InvalidOperationException("Şifreleme anahtarı 256-bit (32 byte) olmalıdır.");
    }

    public EncryptedData Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV(); // Her şifrelemede rastgele IV

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        return new EncryptedData(
            CipherText: Convert.ToBase64String(cipherBytes),
            Iv: Convert.ToBase64String(aes.IV)
        );
    }

    public string Decrypt(EncryptedData data)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = Convert.FromBase64String(data.Iv);

        using var decryptor = aes.CreateDecryptor();
        var cipherBytes = Convert.FromBase64String(data.CipherText);
        var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);

        return Encoding.UTF8.GetString(plainBytes);
    }
}
```

### Key Rotation Planı

```
İlk kurulumda: güçlü anahtar üretilir (openssl rand -base64 32)
Her 6 ayda bir: yeni anahtar → tüm credential'lar re-encrypt edilir
Anahtar geçmişi: eski anahtarlar saklanır (decrypt için)
Anahtar yeri: environment variable KYS_ENCRYPTION_KEY (asla DB'de değil)
```

---

## 4. Input Validation & SQL Injection

### Genel Kurallar

```csharp
// ASLA string concatenation ile SQL yazma
// DOĞRU: EF Core parametreli sorgular
var customers = await _db.Customers
    .Where(c => c.Name.Contains(searchTerm))
    .ToListAsync();

// DOĞRU: Dapper ile parametreli
var result = await _connection.QueryAsync<CustomerDto>(
    "SELECT * FROM customers WHERE code = @Code",
    new { Code = code });

// YANLIŞ: SQL injection açığı
var sql = $"SELECT * FROM customers WHERE code = '{code}'"; // YASAK!
```

### FluentValidation Örnekleri

```csharp
public class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Müşteri adı zorunludur.")
            .MaximumLength(200).WithMessage("Müşteri adı 200 karakteri geçemez.")
            .Matches(@"^[\w\s\-\.&]+$").WithMessage("Geçersiz karakter içeriyor.");

        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(50)
            .Matches(@"^[A-Z0-9\-]+$").WithMessage("Kod büyük harf, rakam ve tire içerebilir.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));

        // JSONB custom fields validasyonu
        RuleFor(x => x.CustomFields)
            .MustAsync(async (fields, ct) =>
                await _customFieldValidator.ValidateAsync("Customer", fields, ct))
            .WithMessage("Özel alanlar geçersiz.");
    }
}
```

---

## 5. HTTP Security Headers

```csharp
// Tüm response'larda zorunlu header'lar
app.Use(async (ctx, next) =>
{
    var headers = ctx.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["X-XSS-Protection"] = "1; mode=block";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    headers["Content-Security-Policy"] =
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
        "font-src 'self' fonts.gstatic.com; " +
        "img-src 'self' data:; " +
        "connect-src 'self' api.kys.sirket.com;";
    await next();
});
```

---

## 6. Audit Log Zorunluluğu

### Mutlaka Log'lanan Olaylar

```csharp
public enum AuditAction
{
    // Entity işlemleri
    Created,
    Updated,
    Deleted,
    Restored,

    // Müşteri lifecycle
    CustomerStatusChanged,
    CustomerArchived,

    // Güvenlik olayları
    LoginSucceeded,
    LoginFailed,
    PasswordChanged,
    AccountLocked,
    AccountUnlocked,

    // Credential olayları (Kritik!)
    CredentialCreated,
    CredentialUpdated,
    CredentialRevealed,    // Her görüntülemede log
    CredentialDeleted
}
```

### Audit Log Interceptor

```csharp
public class AuditInterceptor : SaveChangesInterceptor
{
    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken ct = default)
    {
        var context = eventData.Context!;
        var auditEntries = new List<AuditLog>();

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog) continue; // audit log'u loglama!
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
                continue;

            auditEntries.Add(new AuditLog
            {
                EntityType = entry.Entity.GetType().Name,
                EntityId = (Guid)entry.Property("Id").CurrentValue!,
                Action = entry.State switch
                {
                    EntityState.Added    => AuditAction.Created.ToString(),
                    EntityState.Modified => AuditAction.Updated.ToString(),
                    EntityState.Deleted  => AuditAction.Deleted.ToString(),
                    _ => "Unknown"
                },
                OldValues = entry.State == EntityState.Modified
                    ? JsonSerializer.Serialize(GetOldValues(entry))
                    : null,
                NewValues = JsonSerializer.Serialize(GetNewValues(entry)),
                ChangedBy = _currentUser.Id,
                ChangedAt = _dateTime.UtcNow,
                IpAddress = _httpContext.Connection.RemoteIpAddress?.ToString(),
                CorrelationId = _correlationId.Get()
            });
        }

        context.Set<AuditLog>().AddRange(auditEntries);
        return await base.SavingChangesAsync(eventData, result, ct);
    }
}
```

---

## 7. Sır Yönetimi (Secrets)

### Zorunlu Environment Variables

```bash
# .env.example — gerçek değerler olmadan
KYS_DB_CONNECTION_STRING=         # PostgreSQL connection string
KYS_JWT_SECRET=                   # min 256-bit, base64
KYS_JWT_ISSUER=                   # ör: kys.sirket.com
KYS_JWT_AUDIENCE=                 # ör: kys-api
KYS_ENCRYPTION_KEY=               # AES-256 için 32-byte base64
KYS_CORS_ORIGINS=                 # virgülle ayrılmış URL listesi
KYS_REFRESH_TOKEN_TTL_DAYS=7
KYS_ACCESS_TOKEN_TTL_MINUTES=30
```

### Anahtar Üretim Komutları

```bash
# JWT secret (512-bit)
openssl rand -base64 64

# Encryption key (256-bit)
openssl rand -base64 32

# Bu değerleri asla repo'ya commit etme!
# .env dosyası .gitignore'da olmalı
```

---

## 8. Dependency Güvenliği

```bash
# Her CI pipeline'ında çalıştırılır
dotnet list package --vulnerable --include-transitive
npm audit --audit-level=moderate

# Kabul edilebilir: low severity (dokümante edilmiş geçici istisnalar)
# Kabul edilemez: moderate, high, critical → PR bloklanır
```

---

## 9. HTTPS Zorunluluğu

```csharp
// Production'da HTTP kesinlikle kapalı
app.UseHttpsRedirection();
app.UseHsts();  // HTTP Strict Transport Security

// Nginx config: HTTP → HTTPS redirect
// SSL sertifikası: Let's Encrypt veya kurumsal CA
```

---

## 10. Production Güvenlik Kontrol Listesi

```
□ KYS_JWT_SECRET minimum 64 karakter, rastgele üretilmiş
□ KYS_ENCRYPTION_KEY 32-byte, rastgele üretilmiş
□ .env dosyası git history'de yok (git-secrets ile tarama yapıldı)
□ PostgreSQL şifresi güçlü, sadece uygulama kullanıcısına yetki verilmiş
□ DB kullanıcısı sadece gerekli tablolara erişebilir (minimum privilege)
□ Nginx'de HTTPS zorunlu, HTTP redirect
□ CSP header aktif ve kısıtlayıcı
□ Rate limiting aktif (login + credential reveal)
□ Audit log tablosu uygulama kullanıcısı tarafından silinemez (DB level)
□ Swagger UI production'da kapalı (veya IP whitelist arkasında)
□ Sağlık check endpoint'leri auth gerektirmiyor ama hassas bilgi vermiyor
□ Docker image minimal base image (mcr.microsoft.com/dotnet/aspnet, alpine)
□ Container root olmayan kullanıcıyla çalışıyor
□ Dependency audit CI'da çalışıyor ve yeşil
```
