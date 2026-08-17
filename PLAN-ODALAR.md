# Odalar (çok gruplu kulüp) — uygulama planı

**Durum:** taslak, onay bekliyor. Henüz hiçbir kod yazılmadı.

## Amaç

Tek bir kulüp yerine birden çok arkadaş grubu. Her grup kendi odasında kendi
kitabını oylar ve okur; kitaplık, yorumlar ve alıntılar **ortak** kalır.
Üye onaylama yükü tek kişiden çıkıp oda kurucularına dağılır.

## Temel ayrım (planın belkemiği)

| Kitaba ait → **ortak, değişmiyor** | Gruba ait → **odaya bağlanıyor** |
|---|---|
| `books`, `authors` | `votes` (oylar) |
| `reviews` (yorum/puan) | `elections` (oylama durumu) |
| `quotes` (alıntılar) | `schedule` (okuma takvimi + buluşma) |
| `shelves` (kişisel raflar) | üyelik |
| rozetler, Günün Sözü | |

Bu ayrım sayesinde uygulamanın büyük kısmına hiç dokunulmuyor. Suç ve Ceza'ya
yazılan yorum, onu hangi odanın okuduğundan bağımsız olarak herkese görünür —
istediğin "ortak gezilebilir alan" tam olarak bu.

---

## 1. Veri modeli

### Yeni koleksiyonlar

```
rooms/{roomId}                       // auto-id
  name        string   "Salı Akşamı Okurları"
  description string
  ownerId     string   kurucunun uid'si
  isPublic    bool     ana sayfada/oda listesinde görünsün mü
  createdAt   number

memberships/{roomId}__{uid}          // deterministik kimlik
  roomId      string
  userId      string
  role        "owner" | "member"
  status      "pending" | "active"
  createdAt   number
```

Belge kimliğinin `roomId__uid` olması projenin mevcut deseni (`reviews`,
`shelves`, `votes` hep böyle). Kuralların sorgu yapmadan kimlik doğrulaması
yapmasını sağlıyor ve aynı kişinin iki kez katılma isteği göndermesini
kendiliğinden engelliyor.

### Kimliği değişen koleksiyonlar

| Koleksiyon | Eski kimlik | Yeni kimlik | Eklenen alan |
|---|---|---|---|
| `votes` | `{month}__{uid}` | `{roomId}__{month}__{uid}` | `roomId` |
| `elections` | `{month}` | `{roomId}__{month}` | `roomId` |
| `schedule` | `{month}` | `{roomId}__{month}` | `roomId` |

`roomId` hem kimlikte hem alanda tutuluyor; kural ikisinin tutarlılığını
zorunlu kılacak (mevcut `reviews` kuralındaki desenin aynısı).

### Değişmeyen

`books`, `authors`, `reviews`, `quotes`, `shelves`, `users` — hiçbiri.

---

## 2. Yetki zinciri (dikkat: burada bir kısıt var)

**Kısıt:** Firestore kuralları koleksiyon sorgusu yapamaz. Yani "bu kişi
*herhangi* bir odanın üyesi mi?" diye soramayız — sadece kimliği bilinen tek
bir belgeye bakabiliriz (`exists(/memberships/$(roomId + '__' + uid))`).

Bu yüzden "ortak alana kim yazabilir" sorusu `users/{uid}.approved` bayrağıyla
cevaplanmaya devam ediyor. Yeni olan şu: bu bayrağı artık **oda kurucuları da**
verebiliyor.

### Zincir

1. Sen (site yöneticisi) bir kişiyi onaylıyorsun → o kişi ortak alana yazabilir
   **ve oda kurabilir**.
2. O kişi kendi odasını kuruyor, kendi arkadaşlarının katılma isteklerini
   onaylıyor.
3. Bir odaya kabul edilen kişi ortak alan yetkisini de otomatik kazanıyor.

Yani ikinci arkadaş grubu için **tek bir onay** veriyorsun (grubun kurucusu),
gerisini o hallediyor. Şikayetinin çözümü burası.

### Kuralda nasıl yazılıyor

Oda kurucusu birini onaylarken, o kişinin `users` belgesine `approved: true`
ile birlikte `approvedVia: {roomId}` yazıyor. Kural iki şeyi doğruluyor:

- çağıran kişi gerçekten o odanın sahibi mi (`rooms/{roomId}.ownerId == uid`),
- o odada gerçekten aktif bir üyelik belgesi var mı.

**Oda kurmak `approved: true` gerektiriyor** — bu şart olmazsa herhangi biri
kendine oda açıp kendini onaylayarak zinciri kırardı. Kaynak hep sende kalıyor.

---

## 3. Kural değişiklikleri (`firestore.rules`)

Yeni yardımcılar:

```
isRoomMember(roomId)   memberships/{roomId}__{uid}.status == "active"
isRoomOwner(roomId)    rooms/{roomId}.ownerId == request.auth.uid
```

| Yol | read | create | update | delete |
|---|---|---|---|---|
| `rooms/{id}` | giriş yapmış | `isMember()` (onaylı üye) | sahip / admin | sahip / admin |
| `memberships/{id}` | giriş yapmış | **sadece kendisi**, `status: "pending"` zorunlu | oda sahibi / admin, yalnızca `status` + `role` | kendisi (ayrıl) / sahip (çıkar) |
| `votes/{id}` | oda üyesi | `isRoomMember` + kimlik tutarlılığı | aynısı | kendisi |
| `elections/{id}` | giriş yapmış | oda sahibi / admin | oda sahibi / admin | — |
| `schedule/{id}` | giriş yapmış | oda sahibi / admin | oda sahibi / admin | — |
| `users/{id}` | giriş yapmış | değişmiyor | **+ oda sahibi yolu** (yukarıdaki `approvedVia`) | — |

`elections` ve `schedule` artık site yöneticisine değil **oda sahibine** bağlı —
her grup kendi oylamasını kendi kesinleştiriyor. Site yöneticisi her yerde
yetkili kalmaya devam ediyor.

---

## 4. Yönlendirme (URL yapısı)

| Adres | Sayfa |
|---|---|
| `/odalar` | oda listesi: üyesi olduklarım + katılabileceğim herkese açık odalar |
| `/oda/:roomId` | oda ana sayfası: bu ay okunan kitap, üyeler, (sahibiyse) bekleyen istekler |
| `/oda/:roomId/oylama` | mevcut `VotePage` |
| `/oda/:roomId/takvim` | mevcut `CalendarPage` |
| `/oylama`, `/takvim` | **yönlendirme**: tek odan varsa oraya, çoksa `/odalar`'a |

Oda kimliğini gizli bir "seçili oda" durumunda değil URL'de tutuyoruz: link
paylaşılabilir oluyor ve "hangi odaya bakıyorum" sorusu hep adres çubuğunda
cevaplı. Son iki satır sayesinde mevcut 5 kişi için hiçbir şey bozulmuyor —
eski adresler çalışmaya devam ediyor.

---

## 5. Dosya bazında iş listesi

### Yeni

- `src/types.ts` → `Room`, `Membership` tipleri
- `src/hooks/useRooms.ts` → odalar + kendi üyeliklerim, `createRoom`,
  `requestJoin`, `setMembershipStatus`, `leaveRoom`
- `src/pages/RoomsPage.tsx` → `/odalar` + oda kurma formu
- `src/pages/RoomPage.tsx` → `/oda/:roomId`
- `src/components/RoomMemberApprovals.tsx` → mevcut `MemberApprovals`'ın oda
  sürümü (o dosya site yöneticisi için kalıyor)
- `src/components/RoomSwitcher.tsx` → oda içindeyken hızlı geçiş

### Değişen

| Dosya | Değişiklik |
|---|---|
| `src/hooks/useVoting.ts` | imza `useVoting(roomId, month)`; belge kimlikleri ve kurallar oda bazlı |
| `src/hooks/useSchedule.ts` | imza `useSchedule(roomId)`; `where("roomId","==",roomId)` sorgusu |
| `src/pages/VotePage.tsx` | `roomId`'yi `useParams`'tan alır; kesinleştirme yetkisi `isRoomOwner` |
| `src/pages/CalendarPage.tsx` | aynısı; `setMeeting` oda sahibinde |
| `src/pages/HomePage.tsx` | "Bu Ay Okuyoruz" → üyesi olduğun odaların kartları (ziyaretçiye herkese açık odalar) |
| `src/components/Navbar.tsx` | "Odalar" bağlantısı; `/takvim` ve `/oylama` yerine |
| `src/context/AppContext.tsx` | `rooms`, `myMemberships` dinleyicileri + oda fonksiyonları |
| `src/App.tsx` | yeni rotalar ve yönlendirmeler |
| `firestore.rules` | yukarıdaki tablo |
| `GUVENLIK.md` | yetki zinciri bölümü güncellenir |

---

## 6. Göç (en riskli adım)

Canlıda **7 aylık arşiv** var: `schedule`, `elections`, `votes` kayıtları eski
kimliklerle duruyor. Odalar gelince bunlar kurucu odaya taşınmazsa takvim boşalır.

**Sıfırıncı adım — yedek.** Göçten önce `books`, `authors`, `reviews`, `quotes`,
`shelves`, `votes`, `elections`, `schedule`, `users` koleksiyonlarını JSON olarak
diske indiren tek seferlik bir yönetici butonu. (Ücretsiz Firebase planında
sunucu tarafı dışa aktarma yok, bu yüzden istemciden alıyoruz.) Bu dosya
olmadan göçe başlamıyoruz.

**Göç adımları** (tek seferlik yönetici butonu, `writeBatch` ile):

1. `rooms/bibliyofili` belgesini oluştur — sen sahip, `isPublic: true`.
2. `approved: true` olan her kullanıcı için `memberships/bibliyofili__{uid}`
   (`status: "active"`, sen `owner`).
3. Her `schedule/{month}` → `schedule/bibliyofili__{month}` (+ `roomId`).
4. Her `elections/{month}` → `elections/bibliyofili__{month}` (+ `roomId`).
5. Her `votes/{month}__{uid}` → `votes/bibliyofili__{month}__{uid}` (+ `roomId`).
6. **Doğrula** — sayılar tutuyor mu, takvim ve arşiv ekranda eskisi gibi mi.
7. Ancak ondan sonra eski belgeleri sil (ayrı bir buton).

Kopyala → doğrula → sil sırası kasıtlı: adım 6'da bir sorun çıkarsa eski veri
hâlâ yerinde duruyor ve geri dönmek kuralları eski haline yayınlamaktan ibaret.

---

## 7. Fazlar

Her fazın sonunda site çalışır durumda — istediğin yerde durabiliriz.

| Faz | İçerik | Görünür değişiklik |
|---|---|---|
| **1** | Tipler, `rooms`/`memberships`, kurallar, yedek + göç | Yok (tek oda, her şey eskisi gibi) |
| **2** | `/odalar`, oda kurma, katılma isteği, oda içi onay | Odalar görünür olur |
| **3** | Oylama + takvim odaya bağlanır, yönlendirmeler | Her oda kendi kitabını oylar |
| **4** | Ana sayfa, navbar, oda geçişi cilası | Son hal |

Faz 1 tek başına en riskli ve en az gösterişli kısım; onu ayrı tutmamın sebebi
göçü sakin kafayla doğrulayabilmek.

**Kabaca süre:** faz 1 yarım gün, faz 2–3 birer yarım gün, faz 4 kısa. Toplam
iki günlük iş; projenin şimdiye kadarki en büyük değişikliği.

---

## 8. Kabul kriterleri

- [ ] Mevcut 5 kişi hiçbir şey yapmadan eskisi gibi kullanmaya devam ediyor
- [ ] 7 aylık arşiv göçten sonra eksiksiz görünüyor
- [ ] Onaylı bir üye oda kurabiliyor; onaysız biri kuramıyor
- [ ] Oda sahibi kendi üyesini onaylayınca o kişi ortak alana da yazabiliyor
- [ ] A odasının üyesi B odasının oylarını göremiyor ve oy veremiyor
- [ ] İki oda aynı ay farklı kitap okuyabiliyor
- [ ] Yorumlar ve alıntılar iki odanın üyelerine de görünüyor
- [ ] Kimse kendi kendini onaylayamıyor / yönetici yapamıyor

---

## 9. Karar bekleyen küçük noktalar

1. **Odalar herkese açık listelensin mi?** Plan `isPublic` alanıyla ikisini de
   destekliyor; varsayılan olarak "listelenir ama katılmak onaya bağlı"
   düşünüldü. Tamamen gizli (sadece davet linkiyle) oda da istersen `isPublic:
   false` bunu karşılar.
2. **Bir kişi birden çok odada olabilsin mi?** Plan buna izin veriyor (ek
   maliyeti yok). İstemezsen tek satır kısıt.
3. **Kitaplık ortak olduğu için oylamada tüm kitaplar aday.** İki grubun
   listesi zamanla şişerse "sadece odamdakiler önerdi" filtresi eklenebilir —
   şimdilik kapsam dışı.
