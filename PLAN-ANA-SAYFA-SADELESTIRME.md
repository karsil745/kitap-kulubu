# PLAN — Ana sayfayı sadeleştirme

**Karar tarihi:** 2026-08-15
**Durum:** **Tamamlandı.** Adım 2, 4 ve 5 → 2026-08-29; Adım 1 ve 3 →
2026-09-06 (bkz. adımların altındaki uygulama notları).
**İlgili:** [PLAN-ANA-SAYFA-KULUP-SERIDI.md](PLAN-ANA-SAYFA-KULUP-SERIDI.md) (şeridi ekleyen plan — geri alınmıyor, küçültülüyor)

## Sorun

Bugün ana sayfada beş bölüm var ve **hepsi aynı görsel ağırlıkta**:

1. Hero — bu ayın kitabı
2. Şimdiye kadar okuduklarımız (`ReadingHistory`)
3. En çok önerilenler
4. Kulüpte neler oluyor (`ActivityFeed`)
5. Günün Sözü

Sonuç: sayfa "asıl mesele bu" diyemiyor. Üstelik 2 ve 3, başka sayfaların
özeti — `/takvim` ve `/kitaplar` zaten aynı işi daha iyi yapıyor.

Ana sayfanın tek bir işi olmalı: **bu ay ne okuyoruz, ne zaman buluşuyoruz.**
Geri kalan her şey o cümleyi destekler ya da gider.

## Hedef

Beş bölüm → **üç bölüm**, net bir ağırlık sırasıyla:

1. Hero — bu ayın kitabı + buluşma + katılım
2. Okuma şeridi — künye gibi, tek satır
3. Günün Sözü — sessiz kapanış

## Adımlar

### Adım 1 — Hero ilk perdeyi tek başına alsın ✅ UYGULANDI (2026-09-06)
Hero'nun altındaki her şey ekranın altında kalsın; açılışta göz sadece ayın
kitabını ve buluşmayı görsün.

- Hero'ya alt boşluk ver (kabaca `min-height: 78vh` veya alt `margin`).
- Buluşma satırı bugün küçük bir dipnot; büyütülsün — tarih + (plan hazır olunca)
  katılım düğmesi burada. Bkz [PLAN-KATILIM.md](PLAN-KATILIM.md) Adım 4.
- Ziyaretçiye görünen "Kulübe katıl" bandı hero'nun **içine** girsin, ayrı bir
  şerit olarak ikinci bir bölüm gibi durmasın.

> **Uygulama notu (2026-09-06):**
> - `min-height` **78vh olmadı**, `min(56vh, 470px)` oldu. 78vh kart içinde
>   kısa metinli aylarda kocaman bir ölü boşluk bırakıyor; bu yüzden bir ara
>   `min-height: 0`'a çekilmiş ve hero diğer bölümlerle aynı ağırlığa düşmüştü.
>   Ölçülü taban değerde hero ilk perdenin yaklaşık üçte ikisini alıyor,
>   altındaki bölüm sadece **ucundan görünüyor** — bu bilerek bırakıldı,
>   kaydırma olduğunu söyleyen tek işaret o.
> - Kapak yokken (oylama sürerken aday da yoksa) `.hero-cover` artık hiç
>   basılmıyor: boş esnek öge `gap` kadar hayalet girinti bırakıp hero metnini
>   sayfanın geri kalanından farklı bir sol kenara itiyordu.
> - Buluşma satırı **yerinde kaldı**, sadece tonu (`--muted` → `--ink-2`),
>   puntosu ve üstündeki boşluk büyütüldü. CTA'nın üstüne almak tartışıldı,
>   sıralamayı bozmamak için elendi.
> - Ziyaretçi bandı hero'nun içine girdi ve kart içinde ikinci bir dolgu yüzeyi
>   olmasın diye kılcal çizgiyle ayrılan sessiz bir kapanış satırına dönüştü.
>   `.cta-banner` başka sayfalarda da kullanılıyor, o yüzden yeni görünüm
>   `.hero .cta-banner` altında kapsanmış durumda.

### Adım 2 — "En çok önerilenler" kaldırılsın ✅ UYGULANDI (2026-08-29)
Üç kitap kartı yer kaplıyor ve `/kitaplar` sayfasının kopyası. Hero'daki
"Kitap öner →" bağlantısı aynı yere zaten götürüyor. Bölüm tamamen silinir,
`BookCard` importu ve `popular` hesabı `HomePage`'ten çıkar.

### Adım 3 — Okuma şeridi tek satıra insin ✅ UYGULANDI (2026-09-06)
`ReadingHistory` kalsın (kulübün hafızasını göstermek değerliydi) ama bölüm
gibi değil **künye gibi** dursun:

- Başlık büyüklüğü düşsün, kılcal çizgi + versal mikro-etiket yeter.
- Sayaç ("6 kitap · Şubat 2026'dan beri") ve kapak şeridi tek satırda.
- Ay etiketleri (TEMMUZ 2026, HAZİRAN 2026 …) ayrı satırlarda dökülmesin;
  yatay kaydırılan tek şerit olsun.

> **Uygulama notu (2026-09-06):**
> - Bölüm `.gecmis-bolum` sınıfını aldı; `.section-head` sitenin her yerinde
>   kullanıldığı için küçültme bu kapsam altında yapıldı. Başlık `--fs-h2`
>   (2.15rem'e kadar) yerine 1.18rem: hero'nun yanında ikinci bir "büyük
>   başlık" olmaktan çıktı.
> - Sayaç `.section-head`'in içine, başlığın alt satırına taşındı. Eski
>   `-1.3rem` negatif margin'i gitti.
> - **Kapaklardaki kart kaldırıldı** — kart dilinden bilinçli sapma. "Her blok
>   bir kart" kuralında blok şeridin kendisi; kapak başına kart verilince yan
>   yana 7-8 beyaz yüzey diziliyor ve şerit künye olmaktan çıkıyordu. Kapak
>   104×156 → 78×117 küçüldü, zemin/gölge yerine tek ince gölge kaldı.
> - Ay etiketleri duruyor ama sesi kısıldı (700 → 500 ağırlık, daha küçük
>   punto, daha dar harf aralığı). Silinmedi: kulübün hafızasında "ne zaman"
>   bilgisi asıl değerli olan.
> - Şeridin sağ kenarına `mask-image` ile yumuşak bitiş: kaydırılabildiği
>   görünsün, çerçeve eklenmesin.
> - **Yan karar:** hero bir kart olduğu için metni kartın iç boşluğu kadar
>   içeriden başlıyordu, kartsız bölümler ise tuvalin kenarından — sayfada iki
>   sol kenar vardı. `--kart-ic-yatay` jetonu açıldı, ana sayfadaki kartsız
>   bölüm de aynı yatay boşluğu alıyor. Dikey ritim de `--bolum-arasi` tek
>   jetonuna bağlandı (eskiden 1.2 / 2 / 3 / 3.5rem diye dağılmıştı).
> - **Günün Sözü karttan çıkarıldı**: hero + şerit + alıntı üç ayrı beyaz
>   yüzeydi, en sessiz olması gereken öge en alttaki en parlak kutuydu. Zemin
>   ve gölge gitti, üstündeki kural çizgisi geri geldi. Ortalanmış kalıyor —
>   sola çekmek düşünüldü, kapanış jesti olarak ortada durması korundu.

### Adım 4 — Aktivite akışı ana sayfadan çıksın ✅ UYGULANDI (2026-08-29)
`<ActivityFeed />` `HomePage`'ten kaldırılır. Bileşen **silinmez**, yeni evine
taşınır (Adım 5).

Geriye Günün Sözü kalır ve sayfanın kapanışı olur — tek başına, sessiz, küçük
punto. Bölüm başlığı bile gerekmeyebilir.

> **Uygulama notu (2026-08-29):** Adım 5 akışı sohbetin içine satır satır
> yerleştirdiği için `ActivityFeed.tsx` bileşenine çağıran kalmadı ve **dosya
> silindi** — planın "bileşen silinmez" cümlesi, akış kaybolmasın diye
> yazılmıştı; akış yeni evinde duruyor. Satır metnini üreten `eylem()` işlevi
> kaybolmadı, `useActivity.ts` içine `hareketMetni` adıyla taşındı. Bileşene ait
> `.activity-*` CSS'i de temizlendi. Muhafazakâr alternatife (sohbette sağ sütun)
> dönülecekse eski bileşen git geçmişinde duruyor.

### Adım 5 — Akışın yeni evi: `/sohbet` zaman çizgisi ✅ UYGULANDI (2026-08-29)
Ayrı bir kutu ya da yan sütun değil: akış olayları **sohbet akışının içine**,
kendi zaman sıralarına girer. Sohbetin metaforu tutanak; tutanak konuşulanı da
olanı da yazar.

Nasıl:

- `useActivity()` ile `useMessages()` çıktısı `at`/`createdAt` üzerinden tek
  listede birleştirilip sıralanır. Yeni veri, koleksiyon, kural **yok** —
  akış zaten mevcut koleksiyonlardan türetiliyor.
- Görünüm: soluk, avatarsız, tek satır, italik — sahne notu. Mesaj künyesi
  (ad + saat) yok. Zeminsiz, çerçevesiz.
- **Blok mantığı bozulmamalı:** araya akış satırı giren iki mesaj artık aynı
  blok sayılmaz, künye yeniden yazılır (`ChatPage.tsx`'teki `blokBasi`).
- **Taşma önlemi:** peş peşe 3'ten fazla akış satırı varsa tek satıra katlanır
  ("… ve 5 hareket daha"). Sessiz bir günde akış sohbeti boğmasın.
- Yan fayda: sohbet boşken sayfa artık "Henüz kimse bir şey yazmamış" demiyor.

Değişen tek şey görünürlük: akış bugün ana sayfada ziyaretçiye de açıktı,
`/sohbet` ise `isMember()` ile korunuyor. Yani akış üyelere özel hale gelir —
kasıtlı; raf verisi zaten girişe bağlıydı.

Muhafazakâr alternatif (birleştirme riskli bulunursa): akış `/sohbet`'te geniş
ekranda sağ sütun, mobilde sohbetin altında ayrı bölüm.

Reddedilen: akışa kendi sayfası (`/akis`) açmak — küçük bir kulüpte kimse
sırf bunun için bir sayfaya girmez, menüde de bir madde daha şişirir.

## Kapsam dışı

- Sekme / "daha fazla göster" katlaması — küçük bir kulüpte fazladan tıklama,
  çözdüğünden çok sorun çıkarır.
- Yeni veri, yeni koleksiyon, yeni kural **yok**. Bu tamamen düzen ve CSS işi.
- Sayfaların kendisi (`/kitaplar`, `/takvim`) değişmiyor.
