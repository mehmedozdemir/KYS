# ARCHITECTURE.md — KYS Platform Mimari Kararları

---

## Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────┐
│  Angular 18 SPA (kys-ui)                                    │
│  PrimeNG + NgRx + RxJS                                      │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTPS / REST JSON
┌───────────────────▼─────────────────────────────────────────┐
│  Nginx Reverse Proxy                                        │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│  Kys.Api  (ASP.NET Core 10)                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Controllers (thin) → MediatR → Application Layer   │   │
│  │  Middleware: Auth | ExceptionHandler | Audit | CORS  │   │
│  │  Swagger / OpenAPI                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│  Kys.Application                                            │
│  Commands | Queries | Handlers | Validators | Behaviors     │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────┐    ┌──────────────────────────────────┐
│  Kys.Domain         │    │  Kys.Infrastructure              │
│  Entities           │    │  EF Core + PostgreSQL            │
│  Value Objects      │◄───│  Repositories                    │
│  Domain Events      │    │  Encryption Service              │
│  Interfaces         │    │  Cache (IMemoryCache)            │
│  Exceptions         │    │  Audit Interceptor               │
└─────────────────────┘    │  Background Services             │
                            └──────────────────────────────────┘
                                         │
                            ┌────────────▼─────────────────────┐
                            │  PostgreSQL 16                   │
                            │  (JSONB for custom fields)       │
                            └──────────────────────────────────┘
```

---

## Clean Architecture Katmanları

### Katman 1: Kys.Domain (İçten Dışa — En İç Halka)

**Bağımlılık:** Hiçbir şeye — sıfır NuGet paketi referansı

**İçerik:**
```
Domain/
├── Entities/
│   ├── Base/
│   │   ├── BaseEntity.cs         ← Id, CreatedAt, UpdatedAt, IsDeleted
│   │   ├── AuditableEntity.cs    ← + CreatedBy, UpdatedBy
│   │   └── ISoftDelete.cs
│   ├── Person.cs
│   ├── Team.cs
│   ├── Product.cs
│   ├── Customer.cs
│   └── ... (tüm entity'ler)
├── ValueObjects/
│   ├── Email.cs
│   ├── EncryptedValue.cs
│   └── CustomFields.cs
├── Enumerations/
│   ├── CustomerStatus.cs
│   ├── ProductType.cs
│   └── EmploymentStatus.cs
├── Events/                        ← Domain events (MediatR INotification)
│   ├── CustomerChurnedEvent.cs
│   └── TeamMembershipChangedEvent.cs
├── Exceptions/
│   ├── DomainException.cs
│   ├── CustomerNotFoundException.cs
│   └── ...
├── Repositories/                  ← Sadece interface tanımları
│   ├── ICustomerRepository.cs
│   ├── IProductRepository.cs
│   └── ...
└── Services/                      ← Stateless domain servisleri
    └── CredentialEncryptionService.cs (interface)
```

**Kurallar:**
- Entity'lerde `public set` yok — sadece `private set` veya `init`
- State değişiklikleri domain metotları üzerinden: `customer.Archive()` değil `customer.IsArchived = true`
- Domain event'ler entity'nin `DomainEvents` listesine eklenir, dışarıya dispatch edilmez

---

### Katman 2: Kys.Application (Use Case Katmanı)

**Bağımlılık:** Sadece `Kys.Domain`

**NuGet:** MediatR, FluentValidation, Mapster, ErrorOr

```
Application/
├── Common/
│   ├── Behaviors/
│   │   ├── ValidationBehavior.cs     ← Her command/query için otomatik validasyon
│   │   ├── LoggingBehavior.cs        ← Request/response loglama
│   │   ├── AuditBehavior.cs          ← Audit log yazımı
│   │   └── TransactionBehavior.cs    ← DB transaction yönetimi
│   ├── Interfaces/
│   │   ├── ICurrentUserService.cs    ← Kim giriş yapmış?
│   │   ├── IEncryptionService.cs     ← Credential şifreleme
│   │   ├── ICacheService.cs          ← Cache soyutlaması
│   │   └── IDateTimeProvider.cs      ← Test edilebilir zaman
│   └── Models/
│       ├── PagedList<T>.cs
│       └── PaginationParams.cs
│
├── Customers/
│   ├── Commands/
│   │   ├── CreateCustomer/
│   │   │   ├── CreateCustomerCommand.cs
│   │   │   ├── CreateCustomerCommandHandler.cs
│   │   │   └── CreateCustomerCommandValidator.cs
│   │   ├── ArchiveCustomer/
│   │   └── UpdateCustomerStatus/
│   └── Queries/
│       ├── GetCustomers/
│       │   ├── GetCustomersQuery.cs
│       │   ├── GetCustomersQueryHandler.cs
│       │   └── CustomerListDto.cs
│       └── GetCustomerDetail/
│           ├── GetCustomerDetailQuery.cs
│           ├── GetCustomerDetailQueryHandler.cs
│           └── CustomerDetailDto.cs
│
├── Products/      (aynı yapı)
├── Teams/         (aynı yapı)
├── People/        (aynı yapı)
├── Resources/     (aynı yapı)
├── Credentials/   (özel: reveal endpoint için ayrı handler)
├── KnowledgeBase/ (aynı yapı)
└── Admin/         (CustomFields, AuditLog, Users)
```

**Command/Query Handler Pattern:**
```csharp
public sealed class CreateCustomerCommandHandler
    : IRequestHandler<CreateCustomerCommand, ErrorOr<CustomerCreatedResponse>>
{
    private readonly ICustomerRepository _repository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public async Task<ErrorOr<CustomerCreatedResponse>> Handle(
        CreateCustomerCommand command,
        CancellationToken cancellationToken)
    {
        // 1. İş kuralı kontrolü
        if (await _repository.ExistsByCodeAsync(command.Code, cancellationToken))
            return Error.Conflict("Customer.CodeExists", "Bu kod zaten kullanımda.");

        // 2. Domain entity oluştur
        var customer = Customer.Create(command.Name, command.Code, command.Status);

        // 3. Repository'ye ekle
        await _repository.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 4. Response döndür
        return customer.Adapt<CustomerCreatedResponse>();
    }
}
```

---

### Katman 3: Kys.Infrastructure (Dış Sistemler)

**Bağımlılık:** `Kys.Application` + `Kys.Domain`

```
Infrastructure/
├── Persistence/
│   ├── AppDbContext.cs
│   ├── Configurations/        ← IEntityTypeConfiguration<T> (her entity için)
│   ├── Migrations/
│   ├── Repositories/          ← ICustomerRepository implementasyonu
│   ├── Interceptors/
│   │   ├── AuditInterceptor.cs    ← SaveChanges'de otomatik audit
│   │   ├── SoftDeleteInterceptor.cs
│   │   └── TimestampInterceptor.cs
│   └── UnitOfWork.cs
│
├── Security/
│   ├── EncryptionService.cs       ← AES-256-CBC implementasyonu
│   ├── JwtService.cs
│   └── PasswordHasher.cs          ← BCrypt
│
├── Caching/
│   └── MemoryCacheService.cs
│
├── BackgroundServices/
│   └── DomainEventDispatcher.cs   ← Domain event'leri işler
│
└── DependencyInjection.cs
```

---

### Katman 4: Kys.Api (Sunum Katmanı)

**Bağımlılık:** `Kys.Application` + `Kys.Infrastructure` (sadece DI için)

```
Api/
├── Controllers/
│   ├── v1/
│   │   ├── CustomersController.cs
│   │   ├── ProductsController.cs
│   │   ├── TeamsController.cs
│   │   ├── PeopleController.cs
│   │   ├── EnvironmentsController.cs
│   │   ├── ResourcesController.cs
│   │   ├── CredentialsController.cs
│   │   ├── KnowledgeBaseController.cs
│   │   └── Admin/
│   │       ├── CustomFieldsController.cs
│   │       ├── AuditLogController.cs
│   │       └── UsersController.cs
│   └── AuthController.cs
│
├── Middleware/
│   ├── ExceptionHandlerMiddleware.cs   ← RFC 7807 ProblemDetails
│   ├── CorrelationIdMiddleware.cs
│   └── RequestLoggingMiddleware.cs
│
├── Extensions/
│   ├── PresentationServiceExtensions.cs
│   └── SwaggerExtensions.cs
│
└── Program.cs
```

**Controller Template:**
```csharp
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
[Authorize]
public sealed class CustomersController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission("customers.view")]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetCustomersQuery query,
        CancellationToken ct)
        => Ok(await mediator.Send(query, ct));

    [HttpPost]
    [RequirePermission("customers.create")]
    public async Task<IActionResult> Create(
        [FromBody] CreateCustomerRequest request,
        CancellationToken ct)
    {
        var result = await mediator.Send(request.ToCommand(), ct);
        return result.Match(
            success => CreatedAtAction(nameof(GetById), new { id = success.Id }, success),
            errors => Problem(errors));
    }
}
```

---

## Yetki Sistemi (RBAC)

```csharp
// Custom attribute
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class RequirePermissionAttribute(string permission) : Attribute
{
    public string Permission { get; } = permission;
}

// Policy handler
public class PermissionAuthorizationHandler
    : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var permissions = context.User
            .FindAll("permission")
            .Select(c => c.Value);

        if (permissions.Contains(requirement.Permission))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
```

---

## Encryption Architecture (Credential Güvenliği)

```csharp
public interface IEncryptionService
{
    EncryptedData Encrypt(string plainText);
    string Decrypt(EncryptedData encryptedData);
}

public record EncryptedData(string CipherText, string Iv);

// Implementation: AES-256-CBC
// Key: Environment variable KYS_ENCRYPTION_KEY (32 byte, base64)
// IV: Her şifrelelemede rastgele üretilir
// Saklama: CipherText → resource_credentials.encrypted_value
//          IV → resource_credentials.iv

// Credential reveal akışı:
// 1. GET /api/v1/credentials/{id}/reveal
// 2. RequirePermission("resources.credentials.reveal")
// 3. AuditLog kaydı (CredentialRevealed)
// 4. Decrypt → plaintext response
// 5. Response body: { "value": "..." } — HTTPS zorunlu
```

---

## ADR-001: PostgreSQL + JSONB (Custom Fields)

**Karar:** Custom fields için JSONB kolonu kullanılır.

**Gerekçe:**
- Schema migration gerektirmez → admin UI'dan alan eklenebilir
- PostgreSQL JSONB üzerinde GIN index ile hızlı arama
- EAV (Entity-Attribute-Value) antipattern'inden kaçınılır

**Trade-off:**
- Tip güvenliği uygulama katmanında sağlanmalı
- Karmaşık JSONB sorgular Dapper ile yazılır (LINQ çevirmez)

---

## ADR-002: MediatR + CQRS (Tek Uygulama İçinde)

**Karar:** Mikroservis değil, modüler monolit. MediatR ile CQRS uygulanır.

**Gerekçe:**
- 100 concurrent user → monolit yeterli
- Tek DB → distributed transaction kompleksliği yok
- Geliştirme hızı kritik ilk fazda
- İleride servis çıkarmak gerekirse Application katmanı sınırları belli

---

## ADR-003: Mapster (AutoMapper değil)

**Karar:** Object mapping için Mapster kullanılır.

**Gerekçe:**
- Source-generated mapping → reflection yok, daha hızlı
- Daha basit konfigürasyon
- AutoMapper'ın implicit davranışları hataya açık

---

## ADR-004: Angular + PrimeNG (Blazor değil)

**Karar:** Frontend için Angular 18 standalone + PrimeNG.

**Gerekçe:**
- Daha olgun ekosistem, daha fazla geliştiricinin bildiği
- PrimeNG: DataTable, TreeTable, Chart gibi kurumsal bileşenler hazır
- Blazor: daha yeni, ekip yetkinliği belirsiz
- API'nin ayrı olması → mobil uygulama, 3. parti entegrasyon için uygun

---

## Performance Kararları

```
Sayfalama    : Tüm liste endpoint'leri cursor-based veya offset pagination (yapılandırılabilir)
Cache        : Sık değişmeyen veriler (resource_types, environment_types, system_roles) 
               → IMemoryCache, 30 dakika TTL
N+1 sorunu   : EF Core Include + projection ile engellenir
               Karmaşık sorgular → Dapper + raw SQL
Bağlantı     : PgBouncer önerilir (production'da, docker-compose'da opsiyonel)
Index        : Tüm WHERE koşullarındaki kolonlara index (DATA_MODEL.md'de tanımlı)
```
