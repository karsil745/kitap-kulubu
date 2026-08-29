# PLAN — Buluşmaya katılım işareti

**Karar tarihi:** 2026-08-15
**Durum:** **uygulandı** — dört adımın dördü de kodda (2026-08-29'da doğrulandı).
Kural `firestore.rules` içinde `match /katilim/{katilimId}`, hook
[useKatilim.ts](src/hooks/useKatilim.ts), arayüz [Meeting.tsx](src/components/Meeting.tsx),
ana sayfa satırı [HomePage.tsx](src/pages/HomePage.tsx). Aşağısı kararların
gerekçesi olarak duruyor.

## Ne çözüyor

Bugün takvimde buluşmanın **tarihi** var ([Meeting.tsx](src/components/Meeting.tsx)) ama
kimin geleceği belli değil. Beş kişilik masa mı ayırtılacak on kişilik mi,
buluşmadan önce kimse bilmiyor. Tek eksik bu — daha fazlası değil.

Kapsam dışı (bilerek): mekân alanı, online link, ayda birden çok etkinlik,
hatırlatma bildirimi. Bunlar ayrı işler; bu plan sadece "geliyor musun?"u çözer.

## Veri

Yeni koleksiyon: **`katilim`**

Neden ayrı koleksiyon: `schedule/{month}` kuralda `allow write: if isAdmin()`.
Katılımı oraya dizi olarak koysaydık üye kendi katılımını yazamazdı, ya da
takvimi herkese açmamız gerekirdi. Ayrı belge = herkes yalnızca kendi kaydına
dokunur.

Belge kimliği: **`${month}__${uid}`** — `votes` ile aynı desen. Bir üye bir ay
için tek kayıt tutar; tekrar basınca günceller, ikinci belge oluşmaz.

Alanlar (`types.ts`'e `Katilim` arayüzü):

| alan | tip | not |
|---|---|---|
| `month` | `string` | `"2026-08"` |
| `userId` | `string` | kayıt sahibi |
| `durum` | `"geliyor" \| "gelemiyor"` | üçüncü hâl yok, aşağıya bak |
| `createdAt` | `number` | ms |

Alan adları `votes` ile aynı tutuldu (`month`/`userId`), sadece `durum` Türkçe.
Kardeş koleksiyonla aynı şekli korumak, kuralı ve hook'u birebir kopyalanabilir
kılıyor.

**İki durum, üç değil.** "Belki" işaretini kimse geri dönüp güncellemiyor, sayı
da anlamsızlaşıyor. Cevap vermemek zaten "belki" demek: kayıt yoksa kişi
listede görünmez.

Katılım **aya** bağlı, kitaba değil — yönetici kitap silince katılım kayıtlarına
dokunulmaz. `deleteBook` temizlik listesine `katilim` **eklenmeyecek**.

## Adımlar

### Adım 1 — Kural
`firestore.rules`'a `votes` bloğunun hemen altına `match /katilim/{katilimId}`:

- `read: if request.auth != null` — kimin geleceği üyeler arası bilgi, ziyaretçiye kapalı (`votes` ile aynı gerekçe).
- `create, update: if isMember()` + `userId == request.auth.uid` + `katilimId == month + "__" + uid` + `onlyFields(['month','userId','durum','createdAt'])` + `durum in ['geliyor','gelemiyor']`.
- `delete: if isAdmin() || kendi kaydı`.

Yayınlama (kısa yol): `kitap-kulubu` klasöründe
`.\node_modules\.bin\firebase.cmd deploy --only firestore:rules --non-interactive`

**Kural yayınlanmadan Adım 2-3 test edilemez** — buton "permission-denied" verir.

### Adım 2 — Hook
`src/hooks/useKatilim.ts`, `useVoting.ts` kalıbıyla:

```
useKatilim(month) → { kayitlar, benimDurumum, gelenler, isaretle(durum), kaldir() }
```

- `where("month","==",month)` ile dinle (tek alan, bileşik dizin gerekmez).
- Ziyaretçide dinleyiciyi hiç açma (`useVoting` gibi) — boşuna hata basmasın.
- `isaretle` içinde `isMember` kontrolü; onaysız üye yazamaz.
- Aynı düğmeye ikinci kez basmak kaydı siler (fikir değiştirmenin doğal yolu).

### Adım 3 — Arayüz: Meeting bileşeni
`Meeting.tsx` içine, **sadece `meetingAt` varsa**:

- Buluşma gelecekteyse: iki hap buton — **Geliyorum** / **Gelemem**. Seçili olan
  dolu, diğeri hayalet. Altında gelenlerin avatarları + "n kişi geliyor".
- Buluşma geçmişse: buton yok, sadece "n kişi geldi" satırı.
- Onaysız üyeye buton gösterilmez (zaten `PendingApprovalBanner` durumu açıklıyor).

Tasarım: baloncuk/kutu yok, hap buton — sitenin mevcut dili.

### Adım 4 — Ana sayfa
`HomePage.tsx`'teki `hero-meeting` satırına sayıyı ekle:

> Buluşma · 22 Ağustos Cumartesi 20.00 · **4 kişi geliyor**

Sayı 0 ise ek yazma; boş sayı kimseyi teşvik etmez.

## Sonraya bırakılanlar

- Mekân (`place`) ve online link alanı — ayrı ve daha küçük bir iş, karışmasın.
- "Gelemem" diyene not bırakma hakkı.
- Buluşma yaklaşınca hatırlatma.
