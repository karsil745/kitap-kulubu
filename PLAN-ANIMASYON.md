# Plan — Hareket seti (animasyonlar)

> Teknik sohbette: "kitap-kulubu/PLAN-ANIMASYON.md dosyasını oku ve uygula."
>
> Oluşturma: 2026-08-16 · `PLAN-HAREKET.md`'nin 3. adımından ayrıldı, kendi
> başına yeterli olacak şekilde yazıldı — o dosyayı okumaya gerek yok.

## Amaç

Siteye ölçülü hareket katmak. Dört madde var, hepsi **saf CSS +
`IntersectionObserver`**.

**Yeni paket kurulmayacak.** Framer Motion, GSAP vb. bu kadarı için bundle
şişirir. React'in kendi araçları ve CSS yeterli.

## Önce bilinmesi gerekenler (yoksa yanlış iş yapılır)

- **Hero'ya arka plan görseli EKLENMEYECEK.** Denendi ve kullanıcı isteğiyle
  geri alındı. Bu plan sırasında hero'ya görsel/doku/gradient katma dürtüsü
  gelirse **yapma**.
- **Kapak süzülmesi (`heroFloat`) bilerek silindi.** Geri getirme.
- **Sitede sürekli tekrar eden (döngüsel) animasyon istenmiyor.** Aşağıdaki
  dört maddenin hepsi ya bir kez oynar ya da kullanıcı hareketine cevap verir.
  Marquee / sonsuz döngü / nabız efekti önerme.

---

## 1. Kademeli giriş · hero, sayfa ilk açıldığında

`HomePage.tsx` içindeki hero metni sırayla alttan belirir:
`.hero-eyebrow` → `h1` → `.hero-author` → `.hero-desc` → `.hero-cta`.

- Başlangıç: `opacity: 0`, `transform: translateY(12px)`.
- Süre **500 ms**, yumuşama `cubic-bezier(.2, .7, .2, 1)` (projede zaten
  kullanılan eğri).
- Ögeler arası gecikme **60 ms** → toplam ~800 ms. Daha uzunu bekletme hissi
  verir.
- **Sadece ilk yüklemede.** Rota değişiminde tekrar oynamamalı (o 4. maddenin
  işi).
- **`.hero-cover` bu animasyona dahil DEĞİL.** Kapak olduğu yerde durur.

## 2. Görünürken açılma · yalnızca "Şimdiye kadar okuduklarımız"

`ReadingHistory.tsx` — şerit ekrana girince `.gecmis-oge` ögeleri sırayla
belirir.

- `IntersectionObserver`, eşik **0.2**, tetiklendikten sonra **`unobserve`**.
  Yukarı-aşağı kaydırdıkça tekrar tekrar oynamamalı.
- Ögeler arası **70 ms**, süre **450 ms**, aynı yumuşama.
- **Yalnızca bu bölümde.** Her bölüme koyulursa sayfa yorucu olur.
- Gözlemci `.section`'ı izlesin; 3. maddedeki sayaç da aynı gözlemciyi
  kullansın (iki ayrı gözlemci açmaya gerek yok).

## 3. Sayaç · `.gecmis-sayac`

"14 kitap · 4.312 sayfa · Mart 2025'ten beri" — sayılar görünür olunca 0'dan
hedefe sayar.

- Süre **800 ms**, `easeOutCubic`, bir kez.
- Sayılar `toLocaleString("tr-TR")` ile biçimlenir → binlik ayracı **nokta**
  (4.312), virgül değil.

**DİKKAT — mevcut kod bu haliyle animasyona uygun değil.** `ReadingHistory.tsx`
şu an sayacı tek bir dizge olarak kuruyor:

```
const sayac = [`${okunanlar.length} kitap`, ... ].filter(Boolean).join(" · ");
```

Bu dizgenin içindeki sayıyı tek tek canlandıramazsın. **Önce yapıyı ayır:**
sayılar kendi elemanlarında (örn. `<span data-sayac="14">`) render edilsin,
aradaki " · " ayraçları ve `monthSinceLabel(ilkAy)` metni olduğu gibi kalsın.

İki ayrıntı korunmalı:
- **Sayfa toplamı koşullu.** `sayfaBilinen` false ise o kısım hiç yazılmıyor —
  animasyon bu durumu bozmamalı.
- `monthSinceLabel(ilkAy)` bir tarih metni, **sayı değil**, canlandırılmayacak.

## 4. Sayfa geçişi · rota değişiminde

`App.tsx` — içerik sert belirmek yerine yumuşak gelir.

- **180 ms**, `opacity` + 4px yükselme.
- Kısa tutulmalı: 300 ms üstü gezinmeyi ağır hissettirir. Amaç fark edilmemek,
  yalnızca sertliği almak.
- `useLocation().pathname` anahtar olarak kullanılabilir.

---

## Hepsi için zorunlu kurallar

1. **`prefers-reduced-motion: reduce`** altında 4. madde tamamen kapanır;
   1–3 anında son hâline atlar. Hareketi kapatmış kullanıcı hiçbir bilgi
   kaybetmemeli — sayaç son değeri göstermeli, metinler görünür olmalı.
2. **Başlangıç durumu CSS'te `opacity: 0` OLMAYACAK.** Gizleyen sınıf JS ile
   eklenmeli. Aksi halde JS bir sebeple çalışmazsa içerik **kalıcı olarak
   görünmez** kalır. Varsayılan hep "görünür", animasyon bir ekleme olmalı.
3. Yalnızca **`transform` ve `opacity`** canlandırılacak. `top`, `height`,
   `margin`, `width` gibi yerleşim tetikleyen özellikler kullanılmayacak
   (kare düşmesine yol açar).
4. Gözlemciler `useEffect` içinde kurulup **temizlenmeli** (`disconnect`).

## Dosya haritası

| Dosya | Ne yapılacak |
|---|---|
| `src/pages/HomePage.tsx` | 1. madde: hero ögelerine sıra sınıfı |
| `src/components/ReadingHistory.tsx` | 2. ve 3. madde; **sayaç yapısı ayrılacak** |
| `src/App.tsx` | 4. madde: rota geçişi |
| `src/App.css` | animasyon sınıfları ve keyframes |
| `src/hooks/` (yeni) | ortak `IntersectionObserver` hook'u — projedeki hook deseni ve Türkçe yorum tarzına uysun |

## Kontrol listesi

- [ ] JS hata verdiğinde/çalışmadığında hiçbir içerik görünmez kalmıyor
- [ ] Görünürken açılma **bir kez** oynuyor, tekrar kaydırınca tekrarlamıyor
- [ ] Sayaçta binlik ayracı nokta (4.312)
- [ ] `sayfaBilinen` false iken sayaç bozulmuyor (sayfa kısmı hiç çıkmıyor)
- [ ] "…'ten beri" metni animasyondan etkilenmiyor
- [ ] Rota değişince hero giriş animasyonu **tekrar oynamıyor**
- [ ] `prefers-reduced-motion` açıkken hepsi duruyor, içerik tam görünüyor
- [ ] Mobilde (375px) kare düşmesi yok, sayfa yana taşmıyor
- [ ] Açık ve koyu temada ikisinde de bakıldı
- [ ] Yeni npm paketi kurulmadı
- [ ] Deploy: `kitap-kulubu` klasörünün içinde
      `vercel --prod --token=<TOKEN> --yes`

## Karar günlüğü

- **2026-08-16:** Altı hareket adayı konuşuldu, canlı örnek üzerinden dördü
  seçildi. **Kayan şerit (marquee) elendi** — kulüp şeridi zaten elle
  kaydırılıyor, kendiliğinden akan şeyi okumak sinir bozucu ve dokunmatikte
  kaydırmayla kavga ediyor. **Yavaş yakınlaşma konusuz kaldı** (uygulanacağı
  arka plan görseli geri alındı). **Kapak süzülmesi kaldırıldı.**
