# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Proje Türkçe yazılmıştır: yorumlar, arayüz metinleri ve yeni kod tanımlayıcıları
Türkçedir. Kullanıcıyla Türkçe konuş, kod yorumlarını Türkçe yaz.

## Komutlar

Bu makinede PowerShell `.ps1` betiklerini engelliyor, bu yüzden **`npm` değil
`npm.cmd`** çağır (`npm.cmd run dev`). Node `C:\Program Files\nodejs` altında;
arka planda başlatılan kabuklarda PATH'te olmayabilir, gerekirse tam yol ver.

| Komut | Ne yapar |
|---|---|
| `npm.cmd run dev` | Vite geliştirme sunucusu (5173) |
| `npm.cmd run build` | `tsc -b` + vite build — **tip kontrolü burada yapılır** |
| `npm.cmd run preview` | Derlemeyi yerelde sunar |
| `npm.cmd run lint` | Oxlint |
| `npm.cmd run rules` | Firestore kurallarını yayınlar |

Test altyapısı **yok**. Doğrulama = `build` + `lint` + tarayıcıda bakmak.
Değişikliği "çalışıyor" diye bildirmeden önce en az `build` çalıştır.

> `npm.cmd run rules` bir kez `firebase login` ister ve CLI'ın güncelleme
> kontrolü bu makinede hata veriyor. Kural yayınlamanın her zaman çalışan yolu
> Console'a elle yapıştırmaktır; bkz. GUVENLIK.md.

## Mimari

React 19 + TypeScript + Vite + React Router + Firebase (Auth + Firestore).
Sunucu tarafı kod yok; tüm yetki denetimi `firestore.rules` içinde.

**UI kütüphanesi, bileşen kütüphanesi ve animasyon paketi kullanılmıyor** —
CSS elle yazıldı, animasyonlar saf CSS + `IntersectionObserver`. Yeni bağımlılık
eklemeden önce sor.

### Durum yönetimi

`src/context/AppContext.tsx` tek paylaşılan durumdur: `books`, `users`,
`authors`, `reviews` koleksiyonlarını **uygulama başına birer kez** dinler
(kart başına dinleyici açmamak için) ve `isAdmin` / `isMember` türetir.
Geri kalan her özellik `src/hooks/` altında kendi hook'unda yaşar
(`useVoting`, `useKatilim`, `useShelves`, `useMessages`, `useDiscussion`…).

Tekrarlanan üç kalıp — yeni kod yazarken bunlara uy:

1. **Deterministik belge kimliği.** Kişi başına tek kayıt gereken her yerde
   id elle kurulur: `votes` ve `katilim` → `${month}__${uid}`, `shelves` →
   `${userId}__${bookId}`, `reviews` → `${bookId}__${userId}`, `answers` →
   `${questionId}__${userId}`. Tekrar göndermek günceller, ikinci belge açmaz.
   Kurallar da id'nin bu kalıba uymasını zorunlu kılar.
2. **Ziyaretçide dinleyici hiç açılmaz.** Okuması girişe bağlı koleksiyonlarda
   (`users`, `votes`, `katilim`, `shelves`, `answers`, `mesajlar`) hook önce
   `currentUser`/`isMember` bakar, yoksa boş döner — yoksa konsol boşuna
   "permission-denied" basar.
3. **Türetilen veri saklanmaz.** Akış (`useActivity`), rozetler (`useBadges`) ve
   günün sözü (`useQuoteOfTheDay`) ayrı koleksiyon tutmaz; mevcut
   kayıtlardan hesaplanır. Yeni bir "aktivite" ya da "rozet" koleksiyonu açma.

### Yetki

`isMember` (üye, yazabilir) ve `isAdmin` (yönetici) `users/{uid}` belgesindeki
`approved` ve `role` alanlarından gelir. Giriş yapmış olmak yazma yetkisi
**vermez**. İstemcideki kontroller yalnızca arayüz içindir; gerçek denetim
`firestore.rules`'tadır — yeni yazma yolu eklerken kuralı da ekle.
Ayrıntı: [GUVENLIK.md](GUVENLIK.md).

### Bilinen tuzaklar

- Firestore `undefined` kabul etmez; isteğe bağlı alanlar yazmadan önce
  elenmeli (`addBook`'taki gibi).
- Ay anahtarı hep `"YYYY-MM"` ve **yerel** takvimden üretilir
  (`src/lib/month.ts`). `toISOString()` kullanma — UTC olduğu için ayın ilk
  saatlerinde önceki ayı verir.
- Kitap silinince ona bağlı `reviews`/`quotes`/`shelves`/`votes` de silinir
  (`deleteBook`). `katilim` **bilerek** bu listede değil: katılım aya bağlı.
- Kapak resimlerinde `loading="lazy"` kullanılmıyor — bu projede resimleri
  askıya alıyor.
- `vercel.json`'daki CSP'de `archive.org` **kalmalı**: Open Library kapakları
  oraya yönlendiriyor, silinirse kapakların bir kısmı kaybolur.

## Tasarım dili

Karar geçmişi `PLAN-*.md` dosyalarında; özet kurallar:

- **Kutu, çerçeve, ayraç ve baloncuk sevilmiyor.** Sohbet baloncuksuz
  (tutanak düzeni), akış satırları zeminsiz. Camsı panel, 3B, neon, gradyan yok.
- Kâğıt zemin + beyaz kartlar + hap butonlar; başlıklar serif (Fraunces),
  bölüm etiketleri versal mikro-etiket. Renk paleti seçici 2026-08-15'te
  kaldırıldı, site tek kimlikte; açık/koyu tema `data-theme` ile.
- **Sürekli tekrar eden animasyon yok** (2026-08-16 kararı). Hareket ya bir kez
  oynar ya kullanıcı hareketine cevap verir. Yeni bir döngüsel animasyon
  önerilirse bu karara dönülmeli.
- Animasyonlar yalnızca `transform` ve `opacity`. Başlangıç durumu CSS'te
  `opacity: 0` **olmayacak** — gizleyen sınıfı JS ekler, JS çalışmazsa içerik
  görünür kalır. `prefers-reduced-motion` altında hepsi durur, içerik tam.
- Boş durum metinleri bilinçli olarak azaltıldı: gösterecek şey yoksa bölüm
  hiç render edilmez.
- Türkçe ek üretme. Kitap adına ek getiren kalıplardan kaçın ("Ceza'yı,
  Sefiller'i, 1984'ü" kodla doğru üretilemez); belirtisiz nesne kullan
  ("Suç ve Ceza okuyoruz") ya da adı ayrı bir öge olarak göster.

## PLAN-*.md düzeni

Yapılacak işler gerekçeleriyle `PLAN-*.md` dosyalarında tutulur — sadece "ne
yapılacak" değil, **neyin neden elendiği** de yazılır. Bir işe başlamadan önce
ilgili planı oku, aynı fikri ikinci kez tartışma.

**İş bitince dosyanın başındaki `Durum` satırını ve README'deki plan tablosunu
güncelle.** Bu geçmişte kaçırıldı: PLAN-KATILIM aylarca "kod yazılmadı"
görünürken dört adımı da uygulanmıştı.

## Dağıtım

Firebase projesi `kitapkulup-d09be`, barındırma Vercel (`vercel.json`).
`.env.local` git'e gönderilmez; şablonu `.env.example`.
