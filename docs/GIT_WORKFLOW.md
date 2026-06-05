# GIT_WORKFLOW.md — KYS Platform Git Yönetimi

---

## Branch Stratejisi

```
main          ← production, her zaman deployable, korumalı
develop       ← entegrasyon branch'i (opsiyonel, takım büyürse)
feature/*     ← yeni özellikler
fix/*         ← hata düzeltmeleri
hotfix/*      ← kritik production yamaları
release/*     ← sürüm hazırlığı
docs/*        ← sadece dokümantasyon
refactor/*    ← kod iyileştirme
chore/*       ← bakım, bağımlılık güncellemeleri
```

---

## Branch Adlandırma

```bash
# Format: type/KYS-{ticket-no}-kısa-açıklama
feature/KYS-101-customer-list-page
feature/KYS-102-customer-detail-tabs
fix/KYS-201-credential-reveal-auth
hotfix/KYS-301-login-lockout-bug
docs/KYS-401-api-design-update
refactor/KYS-501-customer-repository
chore/KYS-601-update-primeng-17
```

**Kurallar:**
- Lowercase, tire (-) ile ayrılmış
- Ticket numarası zorunlu (varsa)
- Boşluk, slash (/) içeriğinde yasak
- `main` ve `develop`'a direkt commit yasak

---

## Commit Mesajı Standardı (Conventional Commits)

```
<type>(<scope>): <açıklama>

[opsiyonel gövde — ne ve neden]

[opsiyonel footer — BREAKING CHANGE, Closes #]
```

### Type Listesi

| Type | Ne zaman |
|------|----------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltme |
| `docs` | Sadece dokümantasyon |
| `style` | Formatlama, boşluk (mantık değişikliği yok) |
| `refactor` | Kod iyileştirme (özellik veya fix değil) |
| `perf` | Performans iyileştirmesi |
| `test` | Test ekleme veya düzeltme |
| `build` | Build sistemi, bağımlılıklar |
| `ci` | CI/CD yapılandırması |
| `chore` | Bakım işleri |
| `revert` | Önceki commit'i geri alma |

### Scope Listesi (KYS'e özel)

```
auth, customers, products, teams, people,
environments, resources, credentials, kb,
admin, ui, api, db, docker, ci
```

### Gerçek Örnekler

```bash
feat(customers): add customer archive functionality

Müşteri durumu Churned'a geçildiğinde:
- service_ended_at zorunlu hale getirildi
- is_archived = true set edilir
- Ana listeden otomatik çıkarılır

Closes KYS-105

---

fix(credentials): prevent credential reveal without audit log

reveal endpoint'i audit log yazamadığında 500 dönüyordu.
Transaction içine alındı: audit log veya credential reveal başarısız olursa
ikisi de rollback olur.

Closes KYS-203

---

feat(ui): implement environment resource view with credential masking

- Ortam kaynaklarını kartlarda listeler
- Şifreli alanlar varsayılan gizli (••••••••)
- Göster butonu: confirm dialog + API reveal + 30s countdown + auto-hide
- Kopyala butonu: clipboard + 2s feedback

---

refactor(db): extract shared repository base class

Tüm repository'lerde tekrar eden GetByIdAsync, AddAsync gibi
metotlar BaseRepository<T>'e taşındı.

---

BREAKING CHANGE: rename customer status enum

'Inactive' değeri 'Suspended' olarak değiştirildi.
Migration: Mevcut 'Inactive' değerlerini 'Suspended' yapın.
```

---

## Merge Akışı

```
feature/* → develop (PR ile)
develop   → main    (release PR ile, versiyon bump)
hotfix/*  → main + develop (ayrı PR'lar)
```

**Solo geliştirmede (tek geliştirici):**
```
feature/* → main (PR ile, self-review checklist)
hotfix/*  → main
```

---

## Pull Request Kuralları

### PR Başlığı
```
[KYS-XXX] Kısa açıklama (50 karakter max)

Örnekler:
[KYS-101] Customer list page with filtering and pagination
[KYS-201] Fix: credential reveal missing audit log
```

### PR Açıklaması Şablonu (`.github/pull_request_template.md`)

```markdown
## Değişiklik Özeti
<!-- Ne değişti ve neden? -->

## Test Edildi mi?
- [ ] Unit testler çalışıyor (`dotnet test`)
- [ ] Integration testler çalışıyor
- [ ] Manuel test: [nasıl test edildi]

## Ekran Görüntüleri (UI değişikliği varsa)
<!-- Before/After screenshot -->

## Review Checklist
- [ ] Kod CLAUDE.md kurallarına uyuyor
- [ ] Security: hassas veri log'lanmıyor
- [ ] Security: yetki kontrolü yapılıyor
- [ ] DB: migration var (gerekiyorsa)
- [ ] API: Swagger XML comment'leri güncellendi
- [ ] Breaking change varsa CHANGELOG güncellendi

## İlgili Ticket
Closes KYS-XXX
```

### CI Zorunlulukları (Merge için hepsi yeşil olmalı)

```yaml
# .github/workflows/pr.yml
1. dotnet build --no-restore
2. dotnet test (unit + integration + architecture tests)
3. dotnet format --verify-no-changes
4. dotnet list package --vulnerable
5. ng build --configuration=production
6. ng test --watch=false --browsers=ChromeHeadless
```

---

## Versiyon ve Tag

```bash
# Semantic versioning: MAJOR.MINOR.PATCH
# Her main merge → PATCH bump (en az)
# Yeni özellik → MINOR bump
# Breaking change → MAJOR bump

# Tag formatı
git tag v1.2.3
git push origin v1.2.3

# Pre-release
git tag v2.0.0-beta.1
```

---

## .gitignore (Temel)

```gitignore
# Secrets — asla commit edilmez
.env
.env.*
!.env.example
appsettings.Local.json
appsettings.Development.json    # eğer secret içeriyorsa

# .NET
bin/
obj/
*.user
*.suo
.vs/
.vscode/settings.json
TestResults/

# Node / Angular
node_modules/
dist/
.angular/

# Database
*.db
*.sqlite

# OS
.DS_Store
Thumbs.db
```

---

## Git Hooks (pre-commit)

```bash
# .git/hooks/pre-commit (veya Husky/lefthook ile)

#!/bin/sh
# 1. Gizli veri tarama
if git diff --cached | grep -E "(password|secret|key|token)\s*=\s*['\"][^'\"]{8,}" > /dev/null; then
  echo "❌ Olası gizli veri tespit edildi. Commit engellendi."
  exit 1
fi

# 2. .env dosyası commit edilmesin
if git diff --cached --name-only | grep -E "^\.env$" > /dev/null; then
  echo "❌ .env dosyası commit edilemez!"
  exit 1
fi

# 3. C# format kontrolü
dotnet format --verify-no-changes
if [ $? -ne 0 ]; then
  echo "❌ Kod formatı hatalı. 'dotnet format' çalıştırın."
  exit 1
fi
```
