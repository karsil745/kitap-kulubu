# Plan — Sohbet Odası

> Bu dosya bir **planlama notudur**, kod değildir. Planlama sohbetinde yazıldı,
> teknik sohbette uygulanacak. Teknik sohbette şunu demek yeterli:
> "kitap-kulubu/PLAN-SOHBET-ODASI.md dosyasını oku ve 1. adımı uygula."
>
> Son güncelleme: 2026-08-14

## Amaç

Bibliyofili sitesine, **sadece onaylı üyelerin** birbiriyle yazışabildiği bir
sohbet odası eklemek. Sitenin geri kalanı **aynen kalır**.

## Kapsam dışı (bilinçli olarak yapılmıyor)

Planlama sırasında "gruplar/odalar" düşünüldü, sonra **kapsam dışı bırakıldı**.
Sebep: şimdilik tek grup var, dolayısıyla grup katmanı bugün hiçbir şey
çözmüyor — istenen her şey mevcut yapıda zaten karşılanıyor:

| İstek | Bugün nasıl karşılanıyor |
|---|---|
| "Bizim ayın kitabımız ne?" | `/takvim` — tek grup olduğu için zaten sizin |
| "Geçmiş aylarda okuduklarımız" | `/takvim` geçmiş kayıtları |
| "Her kulüpte okunan kitaplar sayfada görünsün" | `/kitaplar` zaten global |
| "Sadece odaya girenlerle mesajlaşma" | Onaylı üyelik (`isMember`) zaten bu |

Bu yüzden **yapılmayacaklar:** `gruplar` koleksiyonu, davet kodu/bağlantısı,
grup kurma arayüzü, grup başına yönetici, `schedule`/`votes`/`elections`
kayıtlarına `grupId` eklenmesi, grup değiştirici menü.

**Tek ileriye dönük sigorta:** mesaj belgelerine `grupId: "bibliyofili"` alanı
**yazılır** ama sorgularda **kullanılmaz**. İleride ikinci grup gerçekten
gerekirse taşıma tek satırlık iş olur; bugün ise hiçbir maliyeti yok
(özellikle: bileşik dizin (composite index) gerektirmez).

---

## Adım 1 — Veri ve kurallar

**Yeni koleksiyon: `mesajlar`** (auto-id)

```
{
  uid: string,        // yazan üyenin kimliği
  metin: string,      // 1–2000 karakter
  createdAt: number,  // Date.now() (ms) — projedeki diğer koleksiyonlarla tutarlı
  grupId: "bibliyofili"  // ileriye dönük, şimdilik sorgularda kullanılmıyor
}
```

**`firestore.rules` eklentisi:**
- Okuma: sadece `isMember()`. (Ziyaretçi ve onaysız kişi sohbeti **göremez** —
  sitenin geri kalanı herkese açık kalmaya devam eder.)
- Oluşturma: `isMember()` **ve** `request.resource.data.uid == request.auth.uid`
  (başkasının adına mesaj atılamaz) **ve** `metin` boş değil, 2000 karakteri
  aşmıyor.
- Güncelleme: **yasak** (mesaj düzenleme yok — geçmişi kimse değiştiremesin).
- Silme: kişi **kendi** mesajını silebilir; yönetici herkesinkini silebilir.

> ⚠️ **Kritik hatırlatma:** Kurallar yayınlanmazsa sohbet `permission-denied`
> verir ve hiç açılmaz. **Düzeltme (2026-08-14):** elle Console'a yapıştırmaya
> gerek yok — projede `firebase.json` + `.firebaserc` var, klasörün içinde
> `npm run rules` (yani `firebase deploy --only firestore:rules`) yeter.
> ✅ Kurallar 2026-08-14'te bu yolla yayınlandı.

## Adım 2 — Veri katmanı (hook)

**`src/hooks/useMessages.ts`** — projedeki mevcut desene birebir uyar
(`useQuotes` / `useReviews` gibi: `onSnapshot`, Türkçe yorumlar, izole hook).

- Sorgu: `orderBy("createdAt", "desc")` + `limit(100)`, sonra listeyi ters
  çevirip eskiden yeniye göster. (Tek `orderBy`, `where` yok → **bileşik dizin
  gerekmez**.)
- Dinleyici **sadece üye girişliyken** açılır. Onaysız/çıkış yapmış kullanıcıda
  hiç açılmaz — `AppContext`'te `users` dinleyicisinde uygulanan aynı kalıp;
  amaç boşuna `permission-denied` hatası basmamak.
- Dışa verdikleri: `mesajlar`, `gonder(metin)`, `sil(id)`, `yukleniyor`.
- `gonder` içinde: `isMember` değilse hiçbir şey yapma (arayüz zaten
  göstermeyecek ama savunma amaçlı), `metin.trim()` boşsa gönderme.

## Adım 3 — Arayüz

**Yeni sayfa: `/sohbet`** (`src/pages/ChatPage.tsx`) + `App.tsx`'e rota.

**Navbar:** "Sohbet" bağlantısı **yalnızca onaylı üyeye** görünür
(`isMember` kontrolü). Onaysız kişi adresi elle yazarsa "üyeliğin onay
bekliyor" mesajı görür.

**Tasarım — bu madde önemli, klasik sohbet arayüzü bu siteye uymaz:**

Projenin yerleşik dili editoryal dergi: **kutu yok, çerçeve yok, ayraç çizgisi
yok, yuvarlak köşe yok** (bkz. `src/index.css` değişkenleri, `--radius: 3px`).
Dolayısıyla **baloncuk (bubble) kullanılmayacak** — baloncuk tam olarak
kullanıcının sevmediği "kutu" demektir.

Yerine **söyleşi/tutanak düzeni**:
- Gönderenin adı küçük punto **versal + geniş harf aralığı** (mevcut
  mikro-etiket stili, `--track-label`), yanında saat daha soluk.
- Mesaj metni normal akan metin, zemini yok, kenarlığı yok.
- Aynı kişinin arka arkaya mesajlarında ad tekrar edilmez, sadece metin alt
  alta akar.
- Avatar: mevcut `Avatar` bileşeni, küçük boyutta, sadece blok başında.
- Kendi mesajını ayırt etmek için sağa yaslama değil, adın renginde `--accent`
  (bordo) kullanımı yeter.
- Gün değiştiğinde araya ince bir tarih etiketi (versal, küçük) — bölüm başlığı
  kuralıyla aynı dilde.

**Giriş alanı:** sayfanın altında, tek satırlık sade metin alanı + "Gönder".
Enter gönderir, Shift+Enter alt satır. Kutu görünümü değil, altı ince
`--rule` çizgili sade bir alan.

**Kaydırma:** açılışta en alta in; yeni mesaj gelince, kullanıcı zaten
en alttaysa aşağı kaydır (yukarıda geçmişi okuyorsa yerinden oynatma).

**Mobil:** giriş alanı alta sabit; klavye açılınca son mesaj görünür kalmalı.

## Adım 4 — Kontrol listesi (teknik sohbette bitince)

- [x] `firestore.rules` **yayınlandı** (2026-08-14, `npm run rules`).
- [ ] Onaysız bir hesapla `/sohbet` açılınca uygun mesaj çıkıyor mu, konsolda
      `permission-denied` yağmuru var mı?
- [ ] İki farklı tarayıcıda aynı anda mesaj → anlık görünüyor mu?
- [ ] Kendi mesajını silme çalışıyor, başkasınınki silinmiyor mu?
- [ ] Mobil görünümde giriş alanı ve kaydırma düzgün mü?
- [ ] Uzun metin (2000+) ve boş mesaj denendi mi?
- [ ] Vercel'e deploy: **`kitap-kulubu` klasörünün içine girip**
      `vercel --prod --token=<TOKEN> --yes`

---

## Adım 5 — Sohbete kitap iliştirme

> Sadece Adım 1–4 çalışır hâle geldikten sonra yapılır. Sohbetin sade metin
> hâli bozulmadan üstüne eklenir; kitap iliştirmek **isteğe bağlıdır**.

**Veri:** mesaj belgesine tek isteğe bağlı alan eklenir — `bookId?: string`.
Başka hiçbir şey değişmez, mevcut mesajlar geçerli kalır.

**Kural:** `bookId` varsa string olmalı. Zaten mesaj oluşturma `isMember()` ile
korunuyor, ek bir yetki kuralı gerekmez.

**Kitap seçimi:** yeni bir arama/istek **yok**. `AppContext` zaten tüm `books`
listesini bellekte tutuyor; giriş alanının yanındaki "Kitap ekle" ile açılan
küçük bir yazarak-süz listesinden seçilir. Seçilen kitap, gönderilmeden önce
giriş alanının üstünde adıyla görünür ve `×` ile kaldırılabilir.

**Görünüm (kutusuz kalmalı):** mesaj metninin altında küçük kapak (~40px) +
kitap adı ve yazarı, tamamı `/kitap/:id` bağlantısı. Çerçeve, zemin, kart yok —
kapak ve metin doğrudan akışın içinde durur. Mevcut `Cover` bileşeni kullanılır
(`loading="lazy"` **kullanılmaz**, bu projede resimleri askıya alıyor).

**Silinmiş kitap durumu:** yönetici bir kitabı silince `deleteBook`
`reviews`/`quotes`/`shelves`/`votes` kayıtlarını temizliyor. **Mesajlar
silinmeyecek** — sohbet geçmişi bir kitap yüzünden delinmemeli. Bunun yerine
arayüz, `bookId` karşılığı bulunamazsa kitap kısmını hiç göstermez, mesaj metni
olduğu gibi kalır. (Bu yüzden `deleteBook` içindeki temizlik listesine
`mesajlar` **eklenmemeli**.)

---

## Sonraya bırakılanlar (şimdilik yapılmayacak)

Sırayla değeri yüksekten düşüğe:

1. **Okunmamış mesaj göstergesi** — navbar'da küçük bir işaret.
2. **Alıntı paylaşma** — mevcut `quotes` verisinden sohbete aktarma.
3. **Emoji tepkileri.**
4. **Gerçek grup katmanı** — ancak ikinci bir arkadaş grubu siteye katılırsa.

İlgili diğer plan: `PLAN-ANA-SAYFA-KULUP-SERIDI.md` (sohbetten bağımsız,
paralel yapılabilir).

## Karar günlüğü

- **2026-08-13:** Odalara ayırma konuşuldu. Sonuç: tam grup mimarisi (ayrı
  kitaplık, ayrı oylama, davet sistemi) **şimdilik yapılmayacak**; tek gerçek
  ihtiyaç sohbet odası. Sohbet ilk sürümde **sade metin**. Grup kurma yetkisi:
  **tek grup**, kimse grup kuramaz.
- **2026-08-14:** Sohbetten sonraki iki iş seçildi: **mesaja kitap iliştirme**
  (bu dosyada Adım 5) ve **ana sayfada kulüp şeridi** (ayrı dosya). Emoji
  tepkisi, alıntı paylaşma ve okunmamış göstergesi elendi/ertelendi.
