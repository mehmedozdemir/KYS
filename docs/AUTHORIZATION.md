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

### 4.1. Platform rolleri (global, `PersonSystemRole`)
| Rol | Açıklama | Kapsam |
|---|---|---|
| **PlatformAdmin** | Sistem yöneticisi | Global, her şey |
| **CTO** *(yeni)* | Üst teknik yönetim | Global (iş verisi); platform config hariç |
| **Director** | Gözetim/raporlama | Global salt-okuma |
| **TeamLead** | Ekip lideri (genel rol) | Kapsamlı (kendi ekipleri) |
| **Developer** | Yazılımcı | Kapsamlı (kendi ekibi/atamaları) |
| **ReadOnly** | İzleyici | Liste salt-okuma |

> Not: **CTO** rolü eklenecek. "PO müşteri tanımlayabilmeli" gereksinimi PO'nun bağlamsal değil, bir yetenek olduğunu gösteriyor → aşağıda ele alınıyor.

### 4.2. Bağlamsal roller (kayda özgü, türetilmiş)
- **PO (Product Owner):** `Product.PoPersonId == kullanıcı`. Bir ürünün sahibi.
- **Team Lead (bağlamsal):** `TeamMembership.OrganizationRole == 'Lead'` olan kişi, o ekibin sahibi olduğu ürünler/ortamlar üzerinde lider yetkisine sahip.

> "PO" hem bir **yetenek** (müşteri/ürün oluşturabilme) hem bir **kapsam** kaynağıdır (sahibi olduğu ürünler). İkisi ayrı düşünülür.

### 4.3. Açık yetki (hibrit istisna) — `AccessGrant` *(yeni tablo)*
Türetilen kapsamın dışına çıkmak için admin/PO tarafından verilen açık erişim.
```
AccessGrant {
  Id
  PersonId            -> kime
  ScopeType           -> Product | Team | Customer
  ScopeId             -> hangi kayıt
  Level               -> Read | Write
  GrantedBy, GrantedAt, ExpiresAt?
}
```
"Bir yazılımcıya yetki atanırsa kendi ürünlerine veri girebilir" = o kişiye ilgili Product için **Write** grant'ı.

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

## 6. Rol → Yetenek Matrisi (taslak)

| Yetenek | Admin | CTO | Director | TeamLead | Developer | ReadOnly |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| customer:read | ✅ | ✅ | ✅ | ✅(K) | ✅(K) | ✅ |
| customer:create | ✅ | ✅ | — | — | — | — |
| customer:write/archive | ✅ | ✅ | — | — | — | — |
| product:read | ✅ | ✅ | ✅ | ✅(K) | ✅(K) | ✅ |
| product:create | ✅ | ✅ | — | ✅(K) | — | — |
| product:write/assign | ✅ | ✅ | — | ✅(K) | grant(K) | — |
| environment:write | ✅ | ✅ | — | ✅(K) | grant(K) | — |
| credential:view | ✅ | ✅ | — | ✅(K) | ✅(K) | — |
| credential:write | ✅ | ✅ | — | ✅(K) | grant(K) | — |
| team:write/member | ✅ | ✅ | — | ✅(K) | — | — |
| person:create/write | ✅ | ✅ | — | — | — | — |
| kb:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| kb:write | ✅ | ✅ | — | ✅ | ✅(K) | — |
| admin:* | ✅ | — | — | — | — | — |

- **(K)** = yetenek var **ama yalnızca kullanıcının kapsamındaki kayıtlarda** geçerli (Katman B).
- **grant(K)** = yalnızca açık `AccessGrant` Write verilmişse, ve yine kapsam içinde.
- Boş = yok.

> CTO'nun müşteri/ürün oluşturmada global olması, PO'nun ise (PoPersonId üzerinden) kendi ürünlerinde yetkili olması bu matrisle örtüşür. "PO müşteri oluşturabilir" gereksinimi: PO'lara `customer:create` yeteneği verilebilir — bunu **onayda netleştirelim** (PO ayrı bir platform rolü mü, yoksa CTO/TeamLead'e mi yedirilecek?).

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

- **Faz 0 — Temel:** Bu doküman + yetenek sabitleri + rol→yetenek seed güncellemesi (+CTO) + JWT'ye roller/yetenekler + `IScopeService` iskeleti.
- **Faz 1 — Aksiyon kapısı:** Tüm yazma endpoint'lerine yetenek politikası. (En hızlı güvenlik kazancı.)
- **Faz 2 — Yazma kapsamı:** Müşteri/ürün/ortam/credential yazımında sahiplik kontrolü (`RequireWrite`).
- **Faz 3 — Okuma kapsamı:** Scoped roller için liste sorgularının filtrelenmesi (ürün→müşteri→ortam sırası).
- **Faz 4 — Açık grant:** `AccessGrant` tablosu + migration + admin "Erişim Yetkileri" ekranı.
- **Faz 5 — Frontend cila:** Yeteneğe göre buton/menü gizleme, "erişim yok" UX, kapsam rozeti.

---

## 11. Açık Kararlar (onayda netleşecek)

1. **PO bir platform rolü mü** yoksa yetenekleri CTO/TeamLead'e mi yediriyoruz? (PoPersonId zaten kapsam veriyor; soru yetenek tarafı.)
2. **TeamLead müşteri oluşturabilsin mi?** (Şu an taslakta hayır; talep halinde `customer:create`.)
3. **Director vs CTO** ayrımı: Director salt-okuma gözetim, CTO yazabilen üst yönetim — doğru mu?
4. **ReadOnly** gerçekten her şeyi mi okusun, yoksa o da kapsamlı mı? (Taslak: global liste okuma.)
5. **Grant'ın süresi/devri:** `ExpiresAt` ve "PO kendi ürününe grant verebilir mi" yetkisi.
