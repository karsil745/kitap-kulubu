# Plan — Ana Sayfada Kulüp Şeridi

> Planlama notu, kod değil. Teknik sohbette:
> "kitap-kulubu/PLAN-ANA-SAYFA-KULUP-SERIDI.md dosyasını oku ve uygula."
>
> Son güncelleme: 2026-08-14 · Sohbet odası planından **bağımsız**, paralel
> yapılabilir.

## Amaç

Siteye giren kişi ilk ekranda kulübün **kendi hikâyesini** görsün: bu ay ne
okuyoruz, bugüne kadar neler okuduk.

**Yeni veri yok.** Her şey `schedule` koleksiyonunda zaten var, sadece
`/takvim` sayfasının içinde saklı kalıyor. Bu iş tamamen görünürlük işi —
Firestore kuralına, yeni koleksiyona, yeni izne gerek yok.

## Bugünkü durum

`HomePage.tsx` şu sırayla akıyor:

1. Hero — **bu ayın kitabı** (varsa) ya da "oylama sürüyor" hâli. ✅ Bu kısım
   zaten istenen şeyi yapıyor, **dokunulmayacak**.
2. `!currentUser` ise katılım bandı
3. "En çok önerilenler" (3 kitap)
4. `ActivityFeed`
5. `QuoteOfTheDay`

Eksik olan: **geçmiş aylarda okuduklarımız**. `useSchedule().archive` bu veriyi
zaten ay'a göre azalan sırada veriyor.

## Yapılacak

**Yeni bölüm: "Şimdiye kadar okuduklarımız"**, hero'nun hemen **altına**
(katılım bandından sonra, "En çok önerilenler"in üstüne). Kulübün geçmişi,
popüler kitaplardan önce gelmeli — sayfanın hikâyesi böyle kuruluyor.

**Veri:**
- Kaynak `useSchedule().archive`.
- **İçinde bulunulan ay elenir** (o zaten hero'da duruyor, iki kere görünmesin).
- `bookId` karşılığı `books` içinde bulunamayan kayıtlar elenir.
- Hiç geçmiş kayıt yoksa bölüm **hiç render edilmez** (boş durum metni yok —
  boş durumlar bu projede bilinçli olarak kaldırılmıştı).

**Görünüm — yatay şerit:**
- En yeniden eskiye, yan yana kapaklar; taşınca **yatay kaydırma** (dikey
  ızgara değil — geçmiş bir akış, liste değil).
- Her kapağın altında ay etiketi (`monthLabel`, örn. "Temmuz 2026") — versal
  küçük punto, geniş harf aralığı (`--track-label`), soluk renk.
- Kapak tıklanınca `/kitap/:id`.
- Kart yok, çerçeve yok, zemin yok. Mevcut `Cover` bileşeni
  (`loading="lazy"` **kullanılmayacak**).
- Bölüm başlığı mevcut `section-head` kalıbı: üstünde tek `1px solid var(--rule)`
  çizgi, sağında `Tümü →` ile `/takvim`.

**Sayaç (küçük ama kulüp hissini en çok veren detay):**
Başlığın yanında ya da altında tek satır — örn.
*"14 kitap · 4.312 sayfa · Mart 2025'ten beri"*.
- Kitap sayısı: elenmiş arşiv uzunluğu.
- Sayfa: `book.pages` toplamı; `pages` alanı olmayan kitaplar toplama katılmaz.
  **Bazı kitaplarda `pages` boş olabilir** — bu durumda sayfa kısmı hiç
  yazılmaz (yanlış/eksik sayı göstermektense hiç göstermemek yeğdir).
- Tarih: en eski arşiv ayı.

## Kontrol listesi

- [x] Geçmiş kayıt yokken ana sayfa bozulmuyor (bölüm hiç çıkmıyor)
- [x] İçinde bulunulan ay şeritte **tekrar** görünmüyor
- [x] Silinmiş/bulunamayan kitap kaydı şeridi kırmıyor
- [x] `pages` bilgisi eksik kitaplar sayacı yanlış göstermiyor (arşivdeki
      kitapların hepsinde `pages` yoksa sayfa kısmı hiç yazılmıyor)
- [x] Mobilde yatay kaydırma düzgün, sayfa yana taşmıyor (375px'te taşma 0)
- [x] Açık/koyu tema + 4 paletin hepsinde ay etiketi okunaklı (kontrast
      açıkta 4.54–4.85, koyuda ~6.0 — WCAG AA)
- [ ] Deploy: `kitap-kulubu` klasörünün içinde
      `vercel --prod --token=<TOKEN> --yes`

## Karar günlüğü

- **2026-08-14:** "Bizim ayın kitabımız" isteğinin hero'da zaten karşılandığı
  görüldü; iş **geçmiş okumaların ana sayfaya çıkarılmasına** indirgendi.
  Dikey ızgara yerine yatay şerit, ayrıca kulüp sayacı seçildi.
