# AUTHORIZATION.md — KYS Yetkilendirme Modeli (Tasarım)

> Durum: **Taslak / onay bekliyor.** Bu doküman, kodlamaya başlamadan önce yetki
> mimarisini netleştirir. Onaylandıktan sonra fazlı uygulama yapılır.

---

## 1. Amaç ve İlkeler

- **En az ayrıcalık (least privilege):** Bir kullanıcı yalnızca işine yeten kadarını görür/değiştirir.
- **İki ekseni ayır:** "Ne tür işlem yapabilir?" (yetenek) ile "Hangi kayıtlar üzerinde?" (kapsam) **ayrı** çözülür.
- **Need-to-know:** Developer varsayılan olarak yalnızca kendi kapsamını görür (liste sorguları kişiye göre filtrelenir).
- **Türetilmiş + istisna:** Kapsam öncelikle mevcut veriden türetilir (PO, ekip üyeliği, atama); istisnalar açık **grant** ile verilir (hibrit model).
- **Sunucu otoritedir:** Frontend yalnızca UX için butonları gizler; gerçek kontrol her zaman backend'de yapılır.

---

## 2. Mevcut Durum (başlangıç noktası)

- 5 platform rolü + kaba izin string'leri tanımlı ama **çoğu endpoint yalnızca `[Authorize]`** — giriş yapan herkes çekirdek alanda (müşteri/ürün/ekip/ortam) her işlemi yapabiliyor.
- Gerçek kontrol yalnızca: Admin sayfaları, Kaynak kataloğu, Credential uçları (`[RequirePermission]`) + iki veri-kapsamı noktası (dashboard "Çalışma Alanım" ve `ResourceAuthorizationService`).
- **Sahiplik sinyalleri hazır:** `Product.PoPersonId`, `ProductTeam`+`TeamMembership(OrganizationRole)`, `ProductAssignment`.

Sonuç: Yetenek katmanı pratikte yok; kapsam katmanı yalnızca 2 yerde. Bu doküman ikisini de sistematikleştirir.

---

## 3. İki Katmanlı Model

### Katman A — Yetenek (Capability) · *RBAC, endpoint'te*
Kullanıcının **ne tür** işlem yapabileceği. Somut yetenek string'leri ile ifade edilir ve endpoint'lerde politika olarak kontrol edilir.

### Katman B — Kapsam (Scope) · *ilişki tabanlı, handler/sorguda*
Kullanıcının **hangi kayıtlar** üzerinde işlem yapabileceği. Bir `IScopeService` sahiplik grafiğinden hesaplar.

> **Altın kural:** `İzin = Yetenek (A) VE Kapsam (B)`
> Yazma için ayrıca kapsamın **Write** seviyesinde olması gerekir.

---

## 4. Roller

### 4.0. İki boyut: Kapsam × Erişim
Roller iki bağımsız eksenle düşünülür:
- **Kapsam (Scope):** *Global* (tüm sistem) ya da *Scoped* (kullanıcının ürün/ekip kapsamı)
- **Erişim (Access):** *Read* (okuma) · *Write* (yazma) · *Admin* (sistem config)

Bu ayrım, kullanıcının cevaplarındaki CTO=global-gözlemci, Developer=scoped-okuma, Director=global-tam-yetki durumlarını temiz modeller.

### 4.1. Platform rolleri (global, `PersonSystemRole`) — **güncellendi**
| Rol | Kapsam | Erişim | Açıklama |
|---|---|---|---|
| **PlatformAdmin** | Global | Admin + Write | Sistem/teknik yönetici (config, kullanıcı, her şey) |
| **Director** | Global | Write | **En üst iş otoritesi** — tüm iş verisinde tam yetki + kullanıcı/grant yönetimi |
| **PO** *(yeni)* | Scoped (kendi ürünleri) | Write + **create** | Müşteri & ürün oluşturur; sahibi olduğu ürünün tüm alt verisini (ekip, çalışan, ortam, kaynak) girer |
| **CTO** *(yeni)* | Global | **Read (gözlemci)** | Tüm sistemi salt-okur; gerekirse Director seviyesine yükseltilebilir (grant) |
| **TeamLead** | Scoped (kendi ekipleri) | Write | Ekibinin ürünlerini yönetir; PO yokken yerine bakabilir (grant); müşteri **oluşturamaz** ama `customer:create` grant'ı atayıp kaldırabilir |
| **Developer** | Scoped (ekip/atama) | Read (varsayılan) | Kendi çalıştığı ürünleri görür; yazma yalnızca grant ile |
| **ReadOnly** | *Atandığı kapsama göre* | Read | Salt-okuma katmanı. Pratikte: global atanırsa CTO gibi, kişiye atanırsa kendi ürünlerini okur. (Çoğu durum CTO/Developer ile karşılanır; sözleşmeli/dış kullanıcı için ayrı tutulur.) |

> **Director ↔ PlatformAdmin:** ✅ Karar: Director'a sistem/teknik config (`admin:config`) **dahil** — Director yetenek olarak fiilen her şeye yetkili. Fark artık ünvansaldır: `PlatformAdmin` teknik/IT yöneticisi, `Director` en üst iş yöneticisi; yetkiler eşdeğer (`*`).

### 4.2. Bağlamsal roller (kayda özgü, türetilmiş)
- **PO (Product Owner):** `Product.PoPersonId == kullanıcı`. Bir ürünün sahibi.
- **Team Lead (bağlamsal):** `TeamMembership.OrganizationRole == 'Lead'` olan kişi, o ekibin sahibi olduğu ürünler/ortamlar üzerinde lider yetkisine sahip.

> "PO" hem bir **yetenek** (müşteri/ürün oluşturabilme) hem bir **kapsam** kaynağıdır (sahibi olduğu ürünler). İkisi ayrı düşünülür.

### 4.3. Açık yetki (hibrit istisna) — `Grant` *(yeni tablo)*
Türetilen kapsam/yeteneğin dışına çıkmak için verilen açık yetki. İki türü tek tabloda tutuyoruz:

```
Grant {
  Id
  PersonId                 -> kime
  Kind                     -> Scope | Capability
  -- Kind=Scope ise:
  ScopeType                -> Product | Team | Customer
  ScopeId                  -> hangi kayıt
  Level                    -> Read | Write
  -- Kind=Capability ise:
  Capability               -> ör. "customer:create"
  --
  GrantedBy, GrantedAt
  ExpiresAt?               -> opsiyonel (süreli olabilir)
}
```
- **Scope grant:** "Yazılımcıya yetki atanırsa kendi ürününe veri girebilir" = o kişiye ilgili Product için `Write` scope grant'ı.
- **Capability grant:** "TeamLead'e müşteri oluşturma yetkisi atanabilir/silinebilir" = TeamLead'e `customer:create` capability grant'ı.
- **PO yokken devir:** PO izne çıkınca TeamLead'e PO'nun ürünleri için `Write` scope grant'ı (+gerekirse `customer:create`) verilir; süreli (`ExpiresAt`) olabilir.

**Grant verme yetkisi (kim kime grant atayabilir):**
| Veren | Verebileceği grant |
|---|---|
| PlatformAdmin / Director | Her türlü |
| PO | Kendi ürünleri için `Scope` (Read/Write) grant |
| TeamLead | `customer:create` capability grant (atama/kaldırma) + kendi ekibinin ürünleri için PO-devir grant'ı |

---

## 5. Yetenek Kataloğu (Capability)

Biçim: `<alan>:<aksiyon>`. (Öneri; onayda kesinleşir.)

| Alan | Yetenekler |
|---|---|
| customer | `customer:read` · `customer:create` · `customer:write` · `customer:archive` |
| product | `product:read` · `product:create` · `product:write` · `product:assign` (ekip/kişi) |
| team | `team:read` · `team:create` · `team:write` · `team:member` |
| person | `person:read` · `person:create` · `person:write` |
| environment | `environment:read` · `environment:write` (ortam + kaynak ekleme/düzenleme/silme) |
| credential | `credential:view` (göster) · `credential:write` (kaydet/sil) |
| kb | `kb:read` · `kb:write` |
| admin | `admin:config` (özel alan, ortam/kaynak tipi, paylaşımlı kaynak, barındırma platformu) · `admin:users` (kullanıcı/rol) · `admin:audit` |

`*` = tüm yetenekler (PlatformAdmin).

---

## 6. Rol → Yetenek Matrisi — **güncellendi**

| Yetenek | Admin | Director | PO | CTO | TeamLead | Developer | ReadOnly |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| customer:read | ✅ | ✅ | ✅(K) | ✅ | ✅(K) | ✅(K) | (kapsam) |
| customer:create | ✅ | ✅ | ✅ | — | grant | — | — |
| customer:write/archive | ✅ | ✅ | ✅(K) | — | grant(K) | — | — |
| product:read | ✅ | ✅ | ✅(K) | ✅ | ✅(K) | ✅(K) | (kapsam) |
| product:create | ✅ | ✅ | ✅ | — | ✅(K) | — | — |
| product:write/assign | ✅ | ✅ | ✅(K) | — | ✅(K) | grant(K) | — |
| environment:write | ✅ | ✅ | ✅(K) | — | ✅(K) | grant(K) | — |
| credential:view | ✅ | ✅ | ✅(K) | ✅* | ✅(K) | ✅(K) | (kapsam) |
| credential:write | ✅ | ✅ | ✅(K) | — | ✅(K) | grant(K) | — |
| team:write/member | ✅ | ✅ | ✅(K) | — | ✅(K) | — | — |
| person:create/write | ✅ | ✅ | — | — | — | — | — |
| kb:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(kapsam) |
| kb:write | ✅ | ✅ | ✅(K) | — | ✅(K) | ✅(K) | — |
| grant ver/kaldır | ✅ | ✅ | kendi ürünü | — | customer:create + PO-devir | — | — |
| admin:config | ✅ | ✅ | — | — | — | — | — |
| admin:users | ✅ | ✅ | — | — | — | — | — |
| admin:audit | ✅ | ✅ | — | ✅(read) | — | — | — |

- **(K)** = yetenek var **ama yalnızca kullanıcının kapsamındaki kayıtlarda** (Katman B).
- **grant / grant(K)** = yalnızca açık `Grant` verilmişse (capability ve/veya scope).
- **✅\*** (CTO credential:view) = gözlemci olarak metaveriyi görür; **şifre değerini görme** varsayılan kapalı, gerekiyorsa grant ile açılır (onayda netleşsin).
- **(kapsam)** = ReadOnly'nin erişimi atandığı kapsamla sınırlı (global ya da kişisel).

---

## 7. Kapsam Modeli (Scope graph)

`IScopeService` aşağıdaki kümeleri kullanıcı için hesaplar:

```
GlobalGörür(user)   = user ∈ {PlatformAdmin, CTO, Director}
ÜrünKapsamı(user)   = { p | p.PoPersonId = user }
                    ∪ { p | ∃ team ∈ p.Teams, user ∈ team.aktifÜyeler }
                    ∪ { p | ProductAssignment(user, p) aktif }
                    ∪ { p | AccessGrant(user, Product, p, ≥Read) }
MüşteriKapsamı(user)= { c | ∃ cp ∈ c.Products, cp.Product ∈ ÜrünKapsamı(user) }
                    ∪ { c | AccessGrant(user, Customer, c, ≥Read) }
OrtamKapsamı(user)  = { e | e.CustomerProduct.Product ∈ ÜrünKapsamı(user) }
EkipKapsamı(user)   = { t | user ∈ t.aktifÜyeler } ∪ grant
```

**Yazma kapsamı (Write-level):** kayıt üzerinde yazabilmek için
```
YazabilirÜrün(user, p) = GlobalGörür(user)
                       ∨ p.PoPersonId = user
                       ∨ ∃ team ∈ p.Teams: user, team'de OrganizationRole='Lead'
                       ∨ AccessGrant(user, Product, p, Write)
```
(Müşteri/ortam/credential için benzer kurallar; ortam yazımı ürün yazma yetkisine bağlanır.)

---

## 8. Uygulama (Enforcement) Noktaları

### Katman A — Endpoint politikaları
- Her **yazma** endpoint'ine yetenek politikası: `[RequireCapability("product:create")]` gibi (mevcut `RequirePermissionAttribute` genişletilir).
- Hızlı kazanç: "herkes müşteri oluşturabiliyor" sorunu Faz 1'de biter.

### Katman B — Kayıt düzeyi
- **Liste/okuma sorguları:** Scoped roller için repository sorgusu kapsam yüklemiyle filtrelenir (ör. `GetProducts` → kapsamdaki ürünler). Global roller filtresiz.
- **Yazma handler'ları:** Mutasyondan önce `scope.RequireWrite(ScopeType, id)` çağrısı; yetkisizse `ForbiddenException` (403).
- `ResourceAuthorizationService` zaten bu desenin küçük bir örneği — genelleştirilecek.

### Frontend
- `PermissionService` yeteneklere göre buton/menü gizler (UX).
- Liste verisi zaten backend'de filtrelendiği için ek iş minimum.

---

## 9. Token ve Oturum

- JWT'ye kullanıcının **rol kodları** ve **çözülmüş yetenek listesi** eklenir (kapsam JWT'ye konmaz — runtime'da DB'den hesaplanır, istek başına cache'lenebilir).
- Kapsam hesabı için aktif `TeamMembership`/`ProductAssignment`/`AccessGrant` sorguları; sık erişim için istek-ömürlü cache.

---

## 10. Fazlı Uygulama Planı

- **Faz 0 — Temel:** ✅ Yetenek sabitleri + rol→yetenek seed (+PO, +CTO) + wildcard.
- **Faz 1 — Aksiyon kapısı:** ✅ Tüm yazma endpoint'lerine yetenek politikası.
- **Faz 2 — Yazma kapsamı:** ✅ (ürün + ortam) `IScopeService` + `IScopedCommand` marker + `ScopeAuthorizationBehavior`. Ürün/ortam ve alt kayıtları (endpoint, kaynak şablonu, ortam kaynağı, endpoint URL'i, barındırma platformu) yazımı: global rol **VEYA** PO **VEYA** sahibi ekibin aktif üyesi.
  - **Ertelendi (Faz 2b):** Müşteri yazma kapsamı (müşteri sahiplik modeli gerek; şu an `customer:*` yeteneğiyle sınırlı) + credential yazma kapsamı (reveal zaten `ResourceAuthorizationService` ile kapsamlı).
- **Faz 3 — Okuma kapsamı:** Scoped roller için liste sorgularının filtrelenmesi (ürün→müşteri→ortam sırası).
- **Faz 4 — Açık grant:** `AccessGrant` tablosu + migration + admin "Erişim Yetkileri" ekranı.
- **Faz 5 — Frontend cila:** Yeteneğe göre buton/menü gizleme, "erişim yok" UX, kapsam rozeti.

---

## 11. Kararlar (kullanıcı onayı — 2026-06-10)

1. ✅ **PO platform rolü** (aynı zamanda ünvan). Müşteri + ürün oluşturur, sahibi olduğu ürünün tüm alt verisini (ekip/çalışan/ortam/kaynak) girer.
2. ✅ **TeamLead müşteri oluşturamaz** ama `customer:create` grant'ını **atayıp kaldırabilir**; PO izne çıkınca onun ürünlerine **bakabilir** (PO-devir grant'ı).
3. ✅ **Director = en üst yetkili** (tüm iş verisi + write). **CTO = gözlemci** (global salt-okuma), gerekirse Director seviyesine yükseltilebilir.
4. ✅ **ReadOnly atandığı kapsama göre**: global atanırsa tüm sistemi, kişiye atanırsa kendi ürünlerini salt-okur.
5. ✅ **Grant süreli olabilir** (`ExpiresAt`, zorunlu değil). **PO kendi ürününe grant verebilir.**

6. ✅ **Director'a `admin:config` dahil** — Director fiilen her şeye yetkili (`*`). `PlatformAdmin` ile fark ünvansal (teknik vs iş otoritesi).

> Tüm kararlar netleşti. Sonraki adım: **Faz 0/1 kodlaması.**
