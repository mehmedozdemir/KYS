# KYS — Kurumsal Yazılım Yönetim Sistemi

500+ kişilik yazılım şirketleri için müşteri, ürün, ekip ve altyapı bilgilerini
merkezi olarak yöneten web tabanlı kurumsal platform.

---

## Özellikler

- **Müşteri Yönetimi:** Lifecycle takibi, arşivleme, özel alan desteği
- **Ürün Yönetimi:** SaaS / Dedicated / Hybrid modeller, endpoint ve kaynak şablonları
- **Ekip & Kişi Yönetimi:** Rol atamaları, tarihçe kaydı
- **Ortam & Kaynak Yönetimi:** Dinamik kaynak tipleri, şifreli erişim bilgileri
- **Bilgi Tabanı:** Markdown editör, ürün/müşteri bağlantısı, full-text arama
- **Rol Tabanlı Erişim:** 5 sistem rolü, kaynak bazlı yetki kontrolü
- **Audit Log:** Her değişiklik, her credential görüntüleme kayıt altında
- **Dinamik Alanlar:** Şema değişikliği gerektirmeden özel alan tanımı

---

## Gereksinimler

| Araç | Sürüm |
|------|-------|
| .NET SDK | 10.0+ |
| Node.js | 20 LTS+ |
| Docker | 24.0+ |
| Docker Compose | 2.20+ |
| PostgreSQL | 16+ (Docker ile otomatik) |

---

## Hızlı Başlangıç (Geliştirme)

### 1. Repo'yu klonla

```bash
git clone https://github.com/your-org/kys-platform.git
cd kys-platform
```

### 2. Environment değişkenlerini ayarla

```bash
cp .env.example .env
# .env dosyasını düzenle — tüm değerleri doldur
```

### 3. Backend'i başlat

```bash
cd src/backend

# Bağımlılıkları yükle
dotnet restore

# PostgreSQL container'ı başlat
docker compose up postgres -d

# Migration uygula
dotnet ef database update --project Kys.Infrastructure --startup-project Kys.Api

# Seed data yükle (geliştirme ortamı)
../scripts/seed-dev.sh

# API'yi başlat
dotnet run --project Kys.Api
# → http://localhost:5000
# → https://localhost:5001
# → Swagger: https://localhost:5001/swagger
```

### 4. Frontend'i başlat

```bash
cd src/frontend/kys-ui

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
ng serve
# → http://localhost:4200
```

### 5. Giriş yap

```
URL:      http://localhost:4200
Kullanıcı: admin
Şifre:    Admin123!
```

---

## Docker ile Tam Başlatma

```bash
# Tüm servisleri başlat (PostgreSQL + API + Angular)
docker compose up --build

# Arka planda
docker compose up -d --build

# Logları izle
docker compose logs -f api

# Durdur
docker compose down
```

---

## Test Çalıştırma

```bash
# Tüm testler
dotnet test

# Sadece unit testler
dotnet test --filter "Category=Unit"

# Sadece integration testler (PostgreSQL gerektirir)
dotnet test --filter "Category=Integration"

# Coverage raporu
dotnet test --collect:"XPlat Code Coverage"
reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coverage-report -reporttypes:Html

# Angular testler
cd src/frontend/kys-ui && ng test --watch=false
```

---

## Yapılandırma

Tüm yapılandırma environment variable'lardan gelir. `.env.example` dosyasına bakın.

| Değişken | Açıklama | Zorunlu |
|----------|----------|---------|
| `KYS_DB_CONNECTION_STRING` | PostgreSQL bağlantı stringi | ✅ |
| `KYS_JWT_SECRET` | JWT imzalama anahtarı (min 64 char) | ✅ |
| `KYS_JWT_ISSUER` | JWT issuer | ✅ |
| `KYS_ENCRYPTION_KEY` | AES-256 anahtar (32 byte, base64) | ✅ |
| `KYS_CORS_ORIGINS` | İzin verilen origin'ler (virgülle) | ✅ |
| `ASPNETCORE_ENVIRONMENT` | Development / Production | ✅ |

Anahtar üretimi:
```bash
# JWT secret
openssl rand -base64 64

# Encryption key
openssl rand -base64 32
```

---

## Mimari

Clean Architecture + CQRS (MediatR) + PostgreSQL

```
Kys.Domain        ← Entity'ler, iş kuralları, interface'ler
Kys.Application   ← Command/Query handler'lar, validasyon
Kys.Infrastructure← EF Core, şifreleme, cache
Kys.Api           ← ASP.NET Core controller'lar, middleware
kys-ui            ← Angular 18, PrimeNG, NgRx
```

Detaylar: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Katkıda Bulunma

1. `CLAUDE.md` oku (geliştirme kuralları)
2. Feature branch oluştur: `feature/KYS-{no}-açıklama`
3. Commit: Conventional Commits standardı (`docs/GIT_WORKFLOW.md`)
4. PR aç: template'i doldur
5. CI yeşil + review → merge

---

## Dokümantasyon

| Döküman | İçerik |
|---------|--------|
| [CLAUDE.md](CLAUDE.md) | Claude Code talimatları |
| [PROJECT_PLAN.md](PROJECT_PLAN.md) | Sprint planı |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Mimari kararlar |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Veri modeli |
| [docs/API_DESIGN.md](docs/API_DESIGN.md) | API standartları |
| [docs/UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md) | UI/UX kılavuzu |
| [docs/SECURITY.md](docs/SECURITY.md) | Güvenlik gereksinimleri |
| [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) | Git iş akışı |

---

## Lisans

Şirket içi kullanım — tüm haklar saklıdır.
