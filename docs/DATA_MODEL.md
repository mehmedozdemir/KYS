# DATA_MODEL.md — KYS Platform Veri Modeli

Bu döküman tüm entity'leri, ilişkileri, kolon açıklamalarını ve iş kurallarını tanımlar.
EF Core entity'leri ve migration'lar bu dokümana göre yazılır.

---

## Genel Kurallar (Tüm Tablolar)

```sql
-- Her tabloda bulunması zorunlu kolonlar
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by      UUID REFERENCES people(id)
updated_by      UUID REFERENCES people(id)
is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
deleted_at      TIMESTAMPTZ NULL
deleted_by      UUID REFERENCES people(id)
```

- Tüm primary key'ler UUID (GUID)
- Tüm tarihler TIMESTAMPTZ (timezone-aware)
- Soft delete zorunlu — fiziksel silme yasak
- updated_at trigger ile otomatik güncellenir
- PostgreSQL snake_case tablo ve kolon isimleri

---

## 1. Identity & Access Domain

### 1.1 people

Şirketteki tüm kişileri (çalışanlar) tutar. Platform kullanıcıları da bu tablodandır.

```sql
CREATE TABLE people (
    -- base columns (yukarıda tanımlı) --

    -- Kimlik
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,   -- şirket e-postası
    phone               VARCHAR(50),

    -- Çalışma bilgisi
    title               VARCHAR(100),                   -- unvan (ör. "Senior Developer")
    employment_status   VARCHAR(30) NOT NULL DEFAULT 'Active',
                        -- Active | OnLeave | Resigned | Terminated
    hire_date           DATE,
    termination_date    DATE,
    termination_reason  TEXT,

    -- Platform erişimi (kişinin login yapabilmesi için)
    is_platform_user    BOOLEAN NOT NULL DEFAULT FALSE,
    username            VARCHAR(100) UNIQUE,
    password_hash       TEXT,                           -- BCrypt hash
    last_login_at       TIMESTAMPTZ,
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_count  INT NOT NULL DEFAULT 0,

    -- Custom fields
    custom_fields       JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_people_email ON people(email) WHERE is_deleted = FALSE;
CREATE INDEX idx_people_employment_status ON people(employment_status) WHERE is_deleted = FALSE;
```

**İş kuralları:**
- `is_platform_user = true` ise `username` ve `password_hash` zorunlu
- `employment_status = Resigned | Terminated` ise `is_platform_user` false olur (login engellenir)
- `failed_login_count >= 5` → `is_locked = true` (admin unlock edebilir)

---

### 1.2 system_roles

Platform üzerindeki yetki rollerini tanımlar.

```sql
CREATE TABLE system_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    code            VARCHAR(50) NOT NULL UNIQUE,   -- PlatformAdmin, Director, TeamLead, Developer, ReadOnly
    description     TEXT,
    permissions     JSONB NOT NULL DEFAULT '[]',   -- izin listesi
    is_system       BOOLEAN NOT NULL DEFAULT FALSE -- sistem rolü silinemez
);

-- Başlangıç verileri (seed)
-- PlatformAdmin: tüm yetkiler
-- Director: okuma + raporlama
-- TeamLead: ekip yönetimi + kaynak düzenleme
-- Developer: atandığı ürün/müşteri görme
-- ReadOnly: sadece genel listeleri okuma
```

**permissions JSONB yapısı:**
```json
[
  "customers.view", "customers.create", "customers.edit", "customers.archive",
  "products.view", "products.create", "products.edit",
  "teams.view", "teams.manage",
  "resources.view", "resources.credentials.reveal",
  "people.view", "people.manage",
  "admin.customfields", "admin.auditlog", "admin.users"
]
```

---

### 1.3 person_system_roles

```sql
CREATE TABLE person_system_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id   UUID NOT NULL REFERENCES people(id),
    role_id     UUID NOT NULL REFERENCES system_roles(id),
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by  UUID REFERENCES people(id),
    UNIQUE(person_id, role_id)
);
```

---

## 2. Organization Domain

### 2.1 teams

```sql
CREATE TABLE teams (
    -- base columns --

    name            VARCHAR(150) NOT NULL,
    code            VARCHAR(50) NOT NULL UNIQUE,   -- ör. "TEAM-PAYMENT"
    description     TEXT,
    team_type       VARCHAR(30) NOT NULL,           -- Domain | Project | CrossFunctional
    domain_name     VARCHAR(100),                   -- Domain tipi için alan adı (ör. "Payment")
    lead_person_id  UUID REFERENCES people(id),    -- Team Lead
    founded_date    DATE,
    dissolved_date  DATE,                           -- Project ekipler için bitiş
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    color           VARCHAR(7),                     -- UI için hex renk (#3B82F6)
    icon            VARCHAR(50)                     -- UI için icon adı
);
```

---

### 2.2 organization_roles

Şirketteki unvan/pozisyon tanımları.

```sql
CREATE TABLE organization_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,   -- "Senior Developer", "Product Owner"
    code        VARCHAR(50) NOT NULL UNIQUE,    -- "SENIOR_DEV", "PO"
    category    VARCHAR(50),                    -- Management | Engineering | QA | DevOps | Analysis
    level       INT,                            -- sıralama (kıdem seviyesi)
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);
```

---

### 2.3 team_memberships

Kişi-ekip ilişkisi. Tarihçe tutulur — her değişiklik yeni kayıt oluşturur.

```sql
CREATE TABLE team_memberships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id           UUID NOT NULL REFERENCES people(id),
    team_id             UUID NOT NULL REFERENCES teams(id),
    organization_role_id UUID REFERENCES organization_roles(id),
    team_role           VARCHAR(30),       -- Lead | Senior | Member | Observer
    started_at          DATE NOT NULL,
    ended_at            DATE,              -- NULL = hâlâ aktif
    end_reason          TEXT,             -- transfer, proje bitti, vb.
    is_primary_team     BOOLEAN NOT NULL DEFAULT FALSE,  -- kişinin ana ekibi
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID REFERENCES people(id)
);

CREATE INDEX idx_team_memberships_person ON team_memberships(person_id) WHERE ended_at IS NULL;
CREATE INDEX idx_team_memberships_team ON team_memberships(team_id) WHERE ended_at IS NULL;
```

**İş kuralları:**
- `ended_at IS NULL` → aktif üyelik
- Ekip değişimde: mevcut kaydın `ended_at` doldurulur, yeni kayıt oluşturulur
- Bir kişinin aynı anda birden fazla aktif `team_membership`'i olabilir

---

## 3. Product Domain

### 3.1 products

```sql
CREATE TABLE products (
    -- base columns --

    name                VARCHAR(200) NOT NULL,
    code                VARCHAR(50) NOT NULL UNIQUE,   -- "PROD-PAY", "PROD-AUTH"
    description         TEXT,
    version             VARCHAR(30),                   -- "2.4.1"
    product_type        VARCHAR(30) NOT NULL,           -- SaaS | CustomerBased | Hybrid
    status              VARCHAR(30) NOT NULL DEFAULT 'Active',
                        -- Active | Deprecated | Discontinued

    -- Sorumluluk
    po_person_id        UUID REFERENCES people(id),    -- Product Owner

    -- Teknik bilgi
    tech_stack          JSONB DEFAULT '[]',            -- ["Angular", "ASP.NET Core", "PostgreSQL"]
    repository_url      VARCHAR(500),
    documentation_url   VARCHAR(500),

    -- Dinamik alanlar
    custom_fields       JSONB NOT NULL DEFAULT '{}'
);
```

---

### 3.2 product_teams

Ürünü geliştiren/sorumlu olan ekipler.

```sql
CREATE TABLE product_teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id),
    team_id     UUID NOT NULL REFERENCES teams(id),
    role        VARCHAR(50),   -- Owner | Contributor | Support
    since       DATE,
    UNIQUE(product_id, team_id)
);
```

---

### 3.3 product_assignments

Ürün üzerinde aktif çalışan kişiler ve sorumlulukları.

```sql
CREATE TABLE product_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id),
    person_id       UUID NOT NULL REFERENCES people(id),
    responsibility  TEXT,          -- "Backend geliştirme", "DevOps", vb.
    started_at      DATE,
    ended_at        DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(product_id, person_id)  -- partial unique: WHERE is_active = TRUE
);
```

---

### 3.4 product_endpoints

Ürünün frontend ve backend uçlarını tanımlar. Her deployment modeline göre farklılaşır.

```sql
CREATE TABLE product_endpoints (
    -- base columns --

    product_id      UUID NOT NULL REFERENCES products(id),
    name            VARCHAR(150) NOT NULL,         -- "Ana Web Uygulaması", "Yönetim API"
    endpoint_type   VARCHAR(30) NOT NULL,           -- Frontend | RestAPI | gRPC | SOAP | GraphQL
    description     TEXT,
    sort_order      INT NOT NULL DEFAULT 0,

    -- Ürün seviyesinde varsayılan (CustomerBased ürünlerde override edilir)
    default_base_url    VARCHAR(500),
    swagger_url         VARCHAR(500),
    health_check_url    VARCHAR(500),

    -- Auth şablonu (müşteri bazlı override edilebilir)
    default_auth_type   VARCHAR(30),   -- None | BasicAuth | ApiKey | BearerToken | OAuth2
    auth_config_template JSONB DEFAULT '{}'
    -- ör: {"token_url": "/connect/token", "scope": "api"}
);
```

---

## 4. Customer Domain

### 4.1 customers

```sql
CREATE TABLE customers (
    -- base columns --

    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(50) NOT NULL UNIQUE,    -- "CUST-001", "ACME"
    short_name      VARCHAR(100),
    description     TEXT,
    sector          VARCHAR(100),
    country         VARCHAR(100),
    city            VARCHAR(100),

    -- Durum
    status          VARCHAR(30) NOT NULL DEFAULT 'Onboarding',
                    -- Onboarding | Active | Inactive | Churned

    -- Lifecycle tarihleri
    onboarding_started_at   DATE,
    test_env_ready_at       DATE,
    prod_env_ready_at       DATE,
    production_live_at      DATE,
    service_ended_at        DATE,   -- Churned ise dolar
    churn_reason            TEXT,

    -- Arşivleme
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at     TIMESTAMPTZ,

    -- İletişim
    primary_contact_name    VARCHAR(150),
    primary_contact_email   VARCHAR(255),
    primary_contact_phone   VARCHAR(50),

    -- Dinamik alanlar
    custom_fields   JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_customers_status ON customers(status) WHERE is_deleted = FALSE AND is_archived = FALSE;
```

**İş kuralları:**
- `status → Churned` tetiklendiğinde: `service_ended_at` zorunlu, `is_archived = true`, `archived_at = NOW()`
- Arşivlenen müşteriler varsayılan listelerde görünmez (`is_archived = false` filter)

---

### 4.2 customer_products

Müşteri-ürün ilişkisi ve kullanım bilgileri.

```sql
CREATE TABLE customer_products (
    -- base columns --

    customer_id     UUID NOT NULL REFERENCES customers(id),
    product_id      UUID NOT NULL REFERENCES products(id),

    -- Kullanım modeli
    usage_mode      VARCHAR(30) NOT NULL,   -- SaaS | Dedicated
    -- SaaS: müşteri ortak instance üzerinden erişir (env/kaynak tanımı olmaz)
    -- Dedicated: müşteriye özel kurulum (env + kaynak tanımlanır)

    -- Ürünün bu müşterideki durumu
    status          VARCHAR(30) NOT NULL DEFAULT 'Onboarding',
                    -- Onboarding | Active | Inactive | Discontinued

    -- Kurulum tarihleri (Dedicated için)
    installation_started_at DATE,
    test_ready_at           DATE,
    prod_ready_at           DATE,
    go_live_at              DATE,
    discontinued_at         DATE,

    notes           TEXT,

    UNIQUE(customer_id, product_id)
);
```

---

## 5. Environment & Resource Domain

### 5.1 environment_types

Şirket genelinde tanımlı ortam tipleri.

```sql
CREATE TABLE environment_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,   -- "Development", "Test", "UAT", "Production"
    code        VARCHAR(30) NOT NULL UNIQUE,    -- "DEV", "TEST", "UAT", "PROD"
    description TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    color       VARCHAR(7),   -- UI rengi (#EF4444 = kırmızı → prod için uyarı)
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);
```

---

### 5.2 customer_environments

Bir müşteriye atanan ortamlar. Her ortam bir CustomerProduct'a bağlıdır.

```sql
CREATE TABLE customer_environments (
    -- base columns --

    customer_product_id     UUID NOT NULL REFERENCES customer_products(id),
    environment_type_id     UUID NOT NULL REFERENCES environment_types(id),
    name                    VARCHAR(150) NOT NULL,   -- "ACME - Production"
    notes                   TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE(customer_product_id, environment_type_id)
);
```

---

### 5.3 resource_types

Dinamik kaynak tipi tanımları.

```sql
CREATE TABLE resource_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,   -- "PostgreSQL", "Redis", "RabbitMQ"
    code            VARCHAR(50) NOT NULL UNIQUE,    -- "POSTGRESQL", "REDIS"
    category        VARCHAR(50),   -- Database | Cache | Messaging | Search | Identity | External
    icon            VARCHAR(50),
    description     TEXT,
    field_schema    JSONB NOT NULL,  -- bu kaynak tipinin alanlarını tanımlar
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
```

**field_schema JSONB örneği (PostgreSQL için):**
```json
{
  "fields": [
    {"key": "host", "label": "Host", "type": "text", "required": true, "is_sensitive": false},
    {"key": "port", "label": "Port", "type": "number", "required": true, "is_sensitive": false, "default": 5432},
    {"key": "database_name", "label": "Veritabanı Adı", "type": "text", "required": true, "is_sensitive": false},
    {"key": "schema", "label": "Schema", "type": "text", "required": false, "is_sensitive": false},
    {"key": "username", "label": "Kullanıcı Adı", "type": "text", "required": true, "is_sensitive": true},
    {"key": "password", "label": "Şifre", "type": "password", "required": true, "is_sensitive": true},
    {"key": "ssl_mode", "label": "SSL Mode", "type": "select", "options": ["disable","require","verify-full"], "required": false}
  ]
}
```

**Hazır resource_type seed'leri:**
- PostgreSQL, MSSQL, Oracle, MySQL (Database)
- Redis (Cache)
- RabbitMQ, Kafka (Messaging)
- Elasticsearch (Search)
- Keycloak, Azure AD (Identity)
- REST API, gRPC Service, SOAP Service (External)

---

### 5.4 product_resource_templates

Bir ürünün hangi kaynak tiplerini kullandığını tanımlar (şablon).
Müşteri bazlı değerler buradan override edilir.

```sql
CREATE TABLE product_resource_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES products(id),
    resource_type_id    UUID NOT NULL REFERENCES resource_types(id),
    name                VARCHAR(150) NOT NULL,   -- "Ana Veritabanı", "Session Cache"
    description         TEXT,
    is_required         BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order          INT NOT NULL DEFAULT 0,
    -- Paylaşımlı kaynak olabilir mi?
    can_be_shared       BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### 5.5 shared_resources

Birden fazla ürün/müşteri tarafından ortak kullanılan kaynaklar (ör. ortak Redis cluster).

```sql
CREATE TABLE shared_resources (
    -- base columns --

    resource_type_id    UUID NOT NULL REFERENCES resource_types(id),
    name                VARCHAR(150) NOT NULL,
    description         TEXT,
    environment_scope   VARCHAR(30),   -- Dev | Test | Prod | All
    -- Bağlantı bilgileri (field_schema'ya göre doldurulur)
    connection_fields   JSONB NOT NULL DEFAULT '{}'
    -- Hassas alanlar bu JSONB'de AES şifreli tutulur
);
```

---

### 5.6 environment_resources

Bir müşteri ortamındaki kaynak instance'ları.

```sql
CREATE TABLE environment_resources (
    -- base columns --

    customer_environment_id         UUID NOT NULL REFERENCES customer_environments(id),
    product_resource_template_id    UUID NOT NULL REFERENCES product_resource_templates(id),

    -- Paylaşımlı mı yoksa özel mi?
    is_shared               BOOLEAN NOT NULL DEFAULT FALSE,
    shared_resource_id      UUID REFERENCES shared_resources(id),   -- is_shared=true ise

    -- Özel bağlantı bilgileri (is_shared=false ise doldurulur)
    -- field_schema'daki hassas olmayan alanlar burada düz metin
    connection_fields       JSONB NOT NULL DEFAULT '{}',

    notes                   TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE
);
```

---

### 5.7 resource_credentials

Hassas erişim bilgileri. Ayrı tabloda, AES-256 şifreli.

```sql
CREATE TABLE resource_credentials (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Hangi kaynağa ait (ikisinden biri dolu olur)
    environment_resource_id UUID REFERENCES environment_resources(id),
    shared_resource_id      UUID REFERENCES shared_resources(id),

    field_key               VARCHAR(100) NOT NULL,   -- field_schema'daki "password", "api_key"
    encrypted_value         TEXT NOT NULL,           -- AES-256-CBC şifreli, base64
    iv                      VARCHAR(50) NOT NULL,    -- AES IV, base64

    last_rotated_at         TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID REFERENCES people(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by              UUID REFERENCES people(id)
);
```

---

### 5.8 customer_environment_endpoints

Müşteriye özel endpoint URL'leri (product_endpoints'teki şablonu override eder).

```sql
CREATE TABLE customer_environment_endpoints (
    -- base columns --

    customer_environment_id UUID NOT NULL REFERENCES customer_environments(id),
    product_endpoint_id     UUID NOT NULL REFERENCES product_endpoints(id),

    base_url                VARCHAR(500) NOT NULL,
    swagger_url             VARCHAR(500),
    health_check_url        VARCHAR(500),

    -- Auth override
    auth_type               VARCHAR(30),   -- product_endpoint default'u override eder
    -- Hassas auth alanları resource_credentials'a gider
    -- Hassas olmayan alanlar burada
    auth_config             JSONB DEFAULT '{}',

    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    notes                   TEXT,

    UNIQUE(customer_environment_id, product_endpoint_id)
);
```

---

## 6. Custom Fields Domain

### 6.1 custom_field_definitions

```sql
CREATE TABLE custom_field_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(50) NOT NULL,   -- Customer | Product
    field_key       VARCHAR(100) NOT NULL,  -- JSON key adı (snake_case)
    display_name    VARCHAR(150) NOT NULL,  -- UI'da görünen ad
    field_type      VARCHAR(30) NOT NULL,   -- Text | Number | Date | Boolean | Select | Url | Email
    is_required     BOOLEAN NOT NULL DEFAULT FALSE,
    default_value   TEXT,
    select_options  JSONB,                  -- field_type = Select için: ["Aktif","Pasif"]
    validation_rules JSONB DEFAULT '{}',   -- {"min_length": 2, "max_length": 100, "regex": "..."}
    display_order   INT NOT NULL DEFAULT 0,
    group_name      VARCHAR(100),           -- UI'da gruplayabilmek için
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(entity_type, field_key)
);
```

---

## 7. Knowledge Base Domain

### 7.1 kb_articles

```sql
CREATE TABLE kb_articles (
    -- base columns --

    title               VARCHAR(300) NOT NULL,
    content             TEXT NOT NULL,             -- Markdown formatı
    content_preview     VARCHAR(500),              -- İlk 500 karakter, arama için

    -- Bağlam — hangi entity ile ilişkili (hepsi opsiyonel)
    product_id          UUID REFERENCES products(id),
    customer_id         UUID REFERENCES customers(id),
    team_id             UUID REFERENCES teams(id),
    customer_product_id UUID REFERENCES customer_products(id),

    -- Görünürlük
    visibility          VARCHAR(30) NOT NULL DEFAULT 'Team',
                        -- Private | Team | AllDevelopers | Public

    -- Yazar
    author_person_id    UUID NOT NULL REFERENCES people(id),

    -- Metadata
    is_pinned           BOOLEAN NOT NULL DEFAULT FALSE,
    view_count          INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_kb_articles_product ON kb_articles(product_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_kb_articles_customer ON kb_articles(customer_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_kb_articles_content ON kb_articles USING GIN(to_tsvector('turkish', title || ' ' || content));
```

---

### 7.2 kb_tags

```sql
CREATE TABLE kb_tags (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(100) NOT NULL UNIQUE,
    color   VARCHAR(7)
);

CREATE TABLE kb_article_tags (
    article_id  UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES kb_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);
```

---

## 8. Audit Log Domain

### 8.1 audit_logs

```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(100) NOT NULL,    -- "Customer", "Product", vb.
    entity_id       UUID NOT NULL,
    entity_name     VARCHAR(300),             -- entity'nin o anki adı
    action          VARCHAR(30) NOT NULL,     -- Created | Updated | Deleted | Restored | CredentialRevealed
    changed_by      UUID REFERENCES people(id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    old_values      JSONB,                    -- değişiklik öncesi
    new_values      JSONB,                    -- değişiklik sonrası
    diff            JSONB,                    -- sadece değişen alanlar
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    correlation_id  UUID                      -- request correlation ID
);

-- Partition önerisi: aylık partition (büyüdüğünde)
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at DESC);
```

---

## Entity İlişki Özeti

```
people ──────────────────── person_system_roles ──── system_roles
  │
  ├── team_memberships ─────────────────────────────── teams
  │                                                      │
  └── product_assignments ──── products ────────────── product_teams
                                   │
                          product_endpoints
                          product_resource_templates
                                   │
                        customer_products ────── customers
                                   │
                       customer_environments
                                   │
                    environment_resources ─── shared_resources
                                   │                │
                        resource_credentials  resource_credentials
                                   │
                   customer_environment_endpoints

knowledge_base: kb_articles ──── (product | customer | team | customer_product)
audit: audit_logs ────────────── (any entity)
custom_fields: custom_field_definitions ──── (Customer.custom_fields JSONB)
                                         └── (Product.custom_fields JSONB)
```

---

## EF Core Mapping Notları

```csharp
// Global query filter — tüm entity'lerde
modelBuilder.Entity<Customer>()
    .HasQueryFilter(c => !c.IsDeleted && !c.IsArchived);

// JSONB kolonu mapping
modelBuilder.Entity<Customer>()
    .Property(c => c.CustomFields)
    .HasColumnType("jsonb");

// PostgreSQL snake_case convention
modelBuilder.UseSnakeCaseNamingConvention();

// updated_at otomatik güncelleme (trigger yerine interceptor)
// SaveChangesInterceptor ile OnSavingChanges override edilir

// Soft delete interceptor
// ISoftDelete interface'i implemente eden tüm entity'lerde
// fiziksel silme engellenir, IsDeleted = true set edilir
```
