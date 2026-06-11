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

## [0.33.0] — 2026-06-11 (Sprint 36 — Platform Kullanıcı Sağlama + Karşılama Maili (Faz B))

### Eklendi
- **Mevcut kişiyi platforma alma**: `MakePlatformUserCommand` + `POST /admin/users/{id}/make-platform-user` (`admin:users`). Kullanıcı adı = e-posta, şifre belirlenir
- **Karşılama e-postası**: yeni platform kullanıcısı **veya** mevcut kişi platforma alındığında kişiye HTML bilgilendirme maili (platform adresi, kullanıcı adı, geçici şifre). `IAccountEmailService` (best-effort — mail hatası kullanıcı işlemini bozmaz). Platform adresi `appsettings App:PublicUrl`
- **Kullanıcı adı = e-posta**: hem yeni kullanıcı hem platforma alma akışında kullanıcı adı kişinin e-postasıdır (backend zorlar, frontend readonly gösterir)
- **Frontend**: kişi oluşturma formunda kullanıcı adı (e-posta, readonly) + **şifre üret butonu**; kişi listesinde platform kullanıcısı olmayanlar için "Platforma al" diyaloğu (otomatik üretilen şifre + üret butonu)
- **Asenkron mail gönderimi**: karşılama maili artık istek içinde değil, in-process kuyruğa (`IEmailQueue`, Channel tabanlı) atılıp bir `BackgroundService` ile arka planda gönderilir — kişi oluşturma/platforma alma yanıtı SMTP'yi beklemez. (Test maili senkron kalır.)
- **Toplu platforma alma**: Platform Kullanıcıları ekranında "Kişi Ekle" → platform kullanıcısı olmayan kişiler **ekibe göre gruplu** modalda listelenir; çoklu seçim (grup-seç dahil) ile toplu platform kullanıcısı yapılır. Her birine otomatik şifre üretilir ve karşılama maili gönderilir. (`GET /admin/users/provisionable`, `POST /admin/users/make-platform-users` — `admin:users`)

---

## [0.38.0] — 2026-06-11 (Lokalizasyon Faz 0 — TR/EN Altyapı)

### Eklendi
- **Çok dilli altyapı (Transloco)**: çalışma zamanı TR/EN dil değişimi, `public/i18n/{tr,en}.json` sözlükleri, `TranslocoHttpLoader`, tercih `localStorage`'da kalıcı, `<html lang>` güncellenir
- **Dil değiştirici**: topbar'da globe + TR/EN düğmesi (`LanguageService`)
- **Çevrilen ilk kapsam**: sol menü (tüm grup/öğeler), login ekranı, topbar, ortak terimler + platform sloganı
- (Faz 1+: modül modül metin çevirisi — dashboard, müşteriler, ürünler ... devam edecek)

---

## [0.37.0] — 2026-06-11 (Sidebar Yeniden Tasarım — Modern & Responsive)

### Değişti
- **Akordeon menü grupları**: "Tanımlar" ve "Yönetim" katlanabilir, varsayılan kapalı; aktif sayfanın grubu otomatik açılır → kalabalık azaldı
- **Mini (ikon) mod**: topbar menü düğmesiyle sidebar ikon-only moda küçülür (tooltip'li, tercih `localStorage`'da kalıcı)
- **Responsive drawer**: ≤1023px'de sidebar off-canvas; topbar'da hamburger ile açılır, arka plan karartma + sayfa değişince/karartmaya tıklayınca kapanır
- **Görsel cila**: aktif öğede sol vurgu çizgisi, yumuşak hover/geçişler, ferah boşluk, akordeon chevron animasyonu
- `LayoutService` (collapsed/mobileOpen/isMobile) eklendi

---

## [0.36.0] — 2026-06-11 (Sprint 37 — Kurum Profili & Markalama)

### Eklendi
- **Kurum Profili** (tekil): şirket adı, kısa ad, web sitesi, slogan, iletişim, vergi no + **logo** (DB'de saklanır). Migration `Sprint37_OrganizationProfile`
- **Public branding ucu** (anonim): `GET /branding` + `GET /branding/logo` — login ekranı auth'tan önce kullanır. Yazma `admin:config` (`PUT /branding`, `POST/DELETE /branding/logo`)
- **Admin "Kurum Profili" ekranı**: bilgi formu + logo yükleme/önizleme/kaldırma
- **Markalama entegrasyonu**: login ekranı (logo + şirket adı + slogan), sidebar (logo + şirket adı), sayfa başlığı + favicon
- **Maillerde markalama** (Faz 2): tüm e-postalar merkezi olarak logo (inline/cid) + şirket adı başlık + footer (ad · web · iletişim) ile sarmalanır

---

## [0.35.0] — 2026-06-11 (Platform Kullanıcı Yönetimi İyileştirmeleri)

### Eklendi
- **Platform erişimini kaldırma**: Platform Kullanıcıları ekranında "Kaldır" → kişinin platform erişimi geri alınır (kayıt silinmez; kullanıcı adı/şifre/oturum temizlenir). `POST /admin/users/{id}/remove-platform-user`
- **Şifre sıfırlamada otomatik şifre üretme**: reset modalında "üret" butonu (güçlü rastgele şifre)
- **Şifre sıfırlama e-postası**: sıfırlama sonrası kullanıcının e-postasına yeni şifresini bildiren profesyonel HTML mail (async kuyruk). `IAccountEmailService.SendPasswordResetAsync`

---

## [0.34.0] — 2026-06-11 (Mail Otomatik Keşif — Outlook benzeri)

### Eklendi
- **SMTP ayarlarını e-postadan otomatik bulma** (Mail Ayarları → "Ayarları bul"): alan adına göre sırayla bilinen sağlayıcılar (Gmail/Outlook), **DNS SRV `_submission._tcp`**, **MX kaydı** (Office 365 / Google Workspace tespiti) ve son çare tahmin (`smtp.<alan>`). Bulunan sunucu/port/güvenlik forma doldurulur, kaynağı kullanıcıya gösterilir
- `GET /admin/email-accounts/discover?email=` (`admin:config`); `IEmailDiscoveryService` (DnsClient). DnsClient onaylı paketlere eklendi
- **Not:** iç/on-prem (public MX'i olmayan) alanlarda tahmine düşer; kullanıcı düzeltip "Test" ile doğrular

---

## [0.32.0] — 2026-06-11 (Sprint 35 — Mail Altyapısı (Faz A))

### Eklendi
- **`EmailAccount`**: giden e-posta (SMTP) hesabı — birden fazla tanımlanabilir, biri aktif; parola AES ile şifreli (`IEncryptionService`). Migration `Sprint35_EmailAccount`
- **`IEmailSender` / `SmtpEmailSender`** (MailKit): aktif hesapla HTML e-posta gönderimi; STARTTLS/SSL desteği
- **Admin API** `/admin/email-accounts` (`admin:config`): CRUD + aktif seç + test maili gönder
- **Mail Ayarları** admin ekranı: hesap ekle/düzenle/sil, sağlayıcı preset'leri (Exchange `smtp.office365.com:587 STARTTLS` öntanımlı, Gmail, Özel), aktif işaretleme, test gönderimi. Menü + admin paneli kartı
- MailKit onaylı paket listesine eklendi (CLAUDE.md)

### Sonraki (Faz B)
- Mevcut kişiyi platforma alma + welcome e-postası (kullanıcı adı/şifre) + frontend otomatik şifre üretme

---

## [0.31.2] — 2026-06-11 (Düzeltme — Audit Log 500 / çift controller)

### Düzeltildi
- **`GET /admin/audit-logs` 500 (`AmbiguousMatchException`)**: aynı route'a sahip iki controller vardı (`Admin/AuditLogController` + `AdminAuditLogController`). İsim çözümlemesi yapan (`changedByName`) ve frontend ile uyumlu olan `AdminAuditLogController` tutuldu (`admin:audit` guard eklendi); yinelenen controller + `Admin/Queries/GetAuditLogs` query/handler silindi
- **Erişim Yetkileri "Kişi" listesi boş görünüyordu**: `PersonListDto` `fullName` taşımıyor; mapping `firstName + lastName` olarak düzeltildi

---

## [0.31.1] — 2026-06-10 (Kritik Düzeltme — Pipeline Behavior void komutlarda çalışmıyordu)

### Düzeltildi / Güvenlik
- **MediatR pipeline behavior'ları void (`IRequest`) komutlarda sessizce atlanıyordu**: `ScopeAuthorizationBehavior` ve `CustomFieldBehavior` `where TRequest : IRequest<TResponse>` kısıtı taşıyordu; bu MediatR sürümünde `IRequest` (void) `IRequest<Unit>`'e atanamadığı için kapalı behavior tipi oluşturulamıyor ve **Update/Delete/Assign gibi void komutlar için yazma kapsamı kontrolü hiç çalışmıyordu** (yalnızca `IRequest<T>` dönen create'lerde çalışıyordu). Kısıt `notnull` yapıldı → void komutlarda da kapsam + custom field validation devrede
- Gerçek-rol uçtan uca testiyle yakalandı (TeamLead kapsam dışı bir ürünü düzenleyebiliyordu)
- Behavior kaydı `AddOpenBehavior` ile düzeltildi (açık generic için doğru MediatR API'si)

---

## [0.31.0] — 2026-06-10 (Sprint 34 — Yetkilendirme Faz 5: Frontend Cila)

### Eklendi
- **Global 403 bildirimi**: yetkisiz işlemde "Bu işlem için yetkiniz yok" toast (`NotificationService` + AppComponent toast container; auth interceptor 403'ü yakalar)
- **Yeteneğe göre buton gizleme**: ürün/müşteri detay "Düzenle/Durum" butonları `product:write`/`customer:write` yoksa görünmez
- Önceki fazda eklenen liste create butonları zaten yeteneğe göre gizli; bu faz detay aksiyonlarını ve 403 UX'i tamamlar

---

## [0.30.0] — 2026-06-10 (Sprint 33 — Yetkilendirme Faz 4b: Erişim Yetkileri Ekranı)

### Eklendi
- **Admin "Erişim Yetkileri" ekranı** (`/admin/access-grants`): grant listesi (kişi/tür/hedef/seviye/bitiş) + kaldırma + "Yeni Yetki" formu (kapsam veya yetenek, ürün/müşteri hedefi, Read/Write, opsiyonel süre)
- Menüye (Yönetim) + admin paneline kart eklendi

---

## [0.29.0] — 2026-06-10 (Sprint 32 — Yetkilendirme Faz 4a: Açık Grant (Backend))

### Eklendi
- **`AccessGrant` tablosu**: açık yetki — Scope (Product/Team/Customer üzerinde Read/Write) veya Capability (ör. `customer:create`); opsiyonel süre (`ExpiresAt`). Migration `Sprint32_AccessGrant`
- **`IGrantService`/`GrantService`**: scope grant (hedef→ürün/müşteri çözümlemesiyle) ve capability grant kontrolü; süre dikkate alınır
- **Entegrasyon**: `ScopeService` sahiplik yoksa aktif scope grant'ı; `PermissionAuthorizationHandler` statik izin yoksa aktif capability grant'ı dikkate alır (yalnızca statik kontrol başarısızsa DB sorgusu)
- **Admin API**: `/admin/access-grants` GET/POST/DELETE (`admin:users` yetkisi)

### Notlar
- Bu fazda grant yönetimi `admin:users` (Admin/Director) ile sınırlı; PO/TeamLead'in grant verme yetkisi ile Team-grant ürün devralımı sonraki adımda. Frontend ekranı Faz 4b.

---

## [0.28.0] — 2026-06-10 (Sprint 31 — Yetkilendirme Faz 2b: Müşteri & Credential Yazma Kapsamı)

### Eklendi / Güvenlik
- **Müşteri yazma kapsamı**: müşteri güncelle/durum/arşiv/sil/ürün-ekle-çıkar işlemleri artık **oluşturan (`CreatedBy`) VEYA kapsamdaki ürünü kullanan (PO/ekip)** ile sınırlı (8 komut marker'landı); global roller serbest
- **Credential yazma kapsamı**: credential set/sil, hedef kaynağın (env-resource/endpoint/shared) sahiplik kapsamı `ResourceAuthorizationService` ile kontrol edilir
- Müşteri sahipliği için mevcut `AuditableEntity.CreatedBy` (TimestampInterceptor dolduruyor) kullanıldı — yeni alan/migration yok

---

## [0.27.1] — 2026-06-10 (Sprint 30 — Yetkilendirme Faz 3b: Ortam Okuma Kapsamı)

### Eklendi / Güvenlik
- **Ortam okuma kapsamı**: ortam detayı ve müşteri-ürün ortam listesi, kullanıcının kapsamı dışındaysa 403. `IScopeService.CanReadAsync` artık Environment/CustomerProduct/EnvironmentResource türlerini de (atama dahil) çözer
- **Karar:** ekip ve kişi listeleri bilinçli olarak tüm kullanıcılara açık (organizasyon dizini; gizli veri içermez)

---

## [0.27.0] — 2026-06-10 (Sprint 30 — Yetkilendirme Faz 3: Okuma Kapsamı)

### Eklendi / Güvenlik
- **Kayıt düzeyi okuma kapsamı (ürün + müşteri)**: scoped roller (PO/TeamLead/Developer/ReadOnly) ürün ve müşteri **listelerinde** yalnızca kendi kapsamındaki kayıtları görür; başka kaydın **detayına** id ile erişim 403
- **`scope:global` yeteneği**: global okuma rolleri (Admin/Director `*` ile, **CTO** açık) tüm kayıtları görür. CTO seed'ine eklendi (migration `Sprint29_ScopeGlobalCto`)
- `IScopeService` genişletildi: `CanReadAsync`, `HasGlobalReadAccess`, `CurrentUserId`; ürün okuma kapsamı = PO VEYA aktif ekip üyeliği VEYA aktif atama; müşteri = kapsamdaki ürünü kullanan
- Repo `GetAllAsync` artık opsiyonel `scopeUserId` filtresi alır

### Notlar
- **Kalan (Faz 3b):** ortam/ekip/kişi liste filtreleme. Açık `Grant` Faz 4.

---

## [0.26.0] — 2026-06-10 (Sprint 29 — Yetkilendirme Faz 2: Yazma Kapsamı)

### Eklendi / Güvenlik
- **Kayıt düzeyi yazma yetkisi (Katman B)**: `IScopeService` + `IScopedCommand` marker + `ScopeAuthorizationBehavior` (MediatR pipeline). Yetenek (Katman A) "ne tür", kapsam (Katman B) "hangi kayıt" sorusunu çözer
- **Ürün ve ortam yazımı sahipliğe bağlandı**: ürün güncelle/sil/atama, endpoint & kaynak şablonu CRUD, ortam oluştur/sil, ortam kaynağı/endpoint URL'i/barındırma platformu artık **global rol (PlatformAdmin/Director) VEYA ürünün PO'su VEYA sahibi ekibin aktif üyesi** ile sınırlı; aksi halde 403
- Birim test: `ScopeAuthorizationBehaviorTests`

### Notlar
- **Ertelendi (Faz 2b):** müşteri + credential yazma kapsamı. Okuma kapsamı (liste filtreleme) Faz 3; açık `Grant` Faz 4.

---

## [0.25.0] — 2026-06-10 (Sprint 28 — Yetkilendirme Faz 0+1: Aksiyon Kapısı)

### Eklendi
- **Yetenek (capability) modeli**: `Capabilities` sabitleri (`customer:create`, `product:write`, `environment:write`, `admin:config`...); izinler "alan:aksiyon" biçimine geçti
- **Yeni roller**: `PO` (Ürün Sahibi) ve `CTO` (gözlemci); `Director` tam yetkili (`*`); TeamLead/Developer/ReadOnly yeni yeteneklere çevrildi (migration `Sprint28_AuthzCapabilities`)
- **Wildcard yetki**: backend `PermissionAuthorizationHandler` + frontend `PermissionService` artık `*` ve `alan:*` destekler

### Değişti / Güvenlik
- **Tüm yazma endpoint'leri yetenek ile korundu** (`[RequirePermission(...)]`): müşteri/ürün/ekip/kişi/ortam/KB/credential/admin. Önceden giriş yapan herkes yapabiliyordu — artık role bağlı
- Admin/Resource/Credential uçları ince yeteneklere bağlandı (`admin:config`, `admin:users`, `admin:audit`, `credential:view/write`)
- Frontend: ana create butonları (müşteri/ürün/ekip/kişi) yeteneğe göre gizleniyor

### Notlar
- Bu faz **aksiyon düzeyi** (Katman A). **Kayıt düzeyi kapsam** (Katman B) Faz 2-3'te; `Grant` tablosu Faz 4'te.

---

## [0.24.1] — 2026-06-10 (Düzeltme — Özel Alan Enum Eşleşmesi)

### Düzeltildi
- **Özel alanlar admin listesinde görünmüyordu**: Liste `entityType === 0/1` (sayı) ile filtreliyordu ama API `JsonStringEnumConverter` nedeniyle `"Customer"/"Product"` (string) döndürüyor → filtre boş kalıyordu. Karşılaştırma string'e çevrildi
- **Ürün/müşteri formunda özel alan tipi yanlış görünüyordu** (seçim listesi textbox olarak): `fieldType === 4` (sayı) yerine artık `=== 'Select'` (string) karşılaştırması; tüm tip eşlemeleri (Number/Date/Boolean/Url/Email/Select) string enum adına göre düzeltildi
- Etkilenen bileşenler: shared `custom-field-inputs`, admin `custom-fields`, müşteri liste/detay, ürün liste/detay
- **Ürün düzenleme modalında "Durum" alanı boş geliyordu**: aynı enum-string sorunu — ürün `status` (`Active/Deprecated/Discontinued`) sayıyla eşleşmiyordu; ürün detay + liste durum badge'leri ve düzenleme select'i string'e çevrildi
- **Özel alan bileşeninin stili yoktu**: `custom-field-inputs` paylaşımlı bileşeninin kendi `styles` bloğu yoktu (parent'ın scoped stilleri içine sızmaz); form/görünüm stilleri token tabanlı olarak bileşene eklendi
- **Ürün özel alan DEĞERLERİ hiç kaydedilmiyordu**: `CreateProductCommand`/`UpdateProductCommand` `CustomFields`'ı yok sayıyordu (Customer aksine `IHasCustomFields` implement etmiyordu) → kaydedilen değer ne ürün detayında ne düzenleme ekranında görünüyordu. Her iki command `IHasCustomFields` ile `CustomFields`'ı kalıcılaştıracak şekilde düzeltildi (request DTO + handler)
- Ürün özel alan tanımları artık her açılışta taze çekilir (`loadCustomFieldDefs` cache kaldırıldı)

---

## [0.24.0] — 2026-06-10 (Sprint 27 — Hesabım & Şifre Değiştirme)

### Eklendi
- **Hesabım sayfası** (`/account`): profil özeti (ad, e-posta, izinler) + kendi şifresini değiştirme formu; topbar'daki kullanıcı adına tıklanınca açılır
- **`POST /auth/change-password`**: giriş yapan kullanıcı mevcut şifresini doğrulayıp yeni şifre belirler (BCrypt/Identity hasher ile doğrulama; min 8 karakter; şifre değişince refresh token sıfırlanır)
- Self-servis şifre değişimi sayesinde her şifre işlemi için admin'e ihtiyaç kalmadı

---

## [0.23.0] — 2026-06-10 (Sprint 26 — Ürün Ekip/Çalışan Kaldırma)

### Eklendi
- **Ürün detayında ekip ve çalışan kaldırma**: Ekipler sekmesinde ekip kartına, Çalışanlar sekmesinde satıra çöp kutusu butonu eklendi; onay sonrası atama kaldırılır
- **`DELETE /products/{id}/teams/{teamId}`** ve **`DELETE /products/{id}/assignments/{personId}`** endpoint'leri + `RemoveTeamFromProduct` / `RemovePersonFromProduct` command'ları

---

## [0.22.0] — 2026-06-10 (Sprint 25 — Dashboard Sadeleştirme)

### Değişti
- Dashboard'dan "Son Aktiviteler" paneli kaldırıldı (ileride başka bir ekranda kullanılmak üzere). Backend `GET /dashboard/recent-activities` endpoint'i korundu; yalnızca frontend paneli ve ona ait orphan kod/CSS temizlendi

---

## [0.21.0] — 2026-06-10 (Sprint 24 — Barındırma Platformu)

### Eklendi
- **Barındırma Platformu kataloğu**: Ortamların üzerinde çalıştığı platform (Kubernetes, Docker, Linux Sunucu, Windows Sunucu, AWS, Azure, Google Cloud) artık tanımlanabiliyor — admin tarafından yönetilen `HostingPlatform` referans entity'si (ikon + renk + kategori)
- **Admin → Barındırma Platformları** sayfası: liste + ekle/düzenle/sil (kullanımda olan platform silinemez, 409), önizlemeli renk/ikon seçimi; "Tanımlar" menü grubuna eklendi
- **Ortam ↔ platform**: `CustomerEnvironment.HostingPlatformId` (nullable FK); ortam oluştururken platform seçilebiliyor, ortam detayında sonradan değiştirilebiliyor (`PUT /environments/{id}/hosting-platform`)
- **Platform rozeti**: Ortam detay başlığında, müşteri detayındaki ortam kartlarında ve dashboard Çalışma Alanım env kartında ikon+renkli platform rozeti
- **Endpoint'ler**: `GET /environments/hosting-platforms`, `POST/PUT/DELETE /admin/hosting-platforms`

### Migration
- `Sprint24_HostingPlatform`: `hosting_platforms` tablosu (7 varsayılan platform seed) + `customer_environments.hosting_platform_id` (nullable FK, ON DELETE SET NULL)

---

## [0.20.0] — 2026-06-10 (Sprint 23 — Workspace Varsayılan Kapalı)

### Değişti
- Çalışma Alanım widget'ında müşteri satırları artık varsayılan **kapalı** geliyor (tıklayınca açılır); önceden hepsi açık geliyordu. Arama veya tip filtresi aktifken ilgili satırlar otomatik açılır

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
