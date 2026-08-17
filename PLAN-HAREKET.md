# Plan — Hareket ve Hero Sunumu

> Planlama notu, kod değil. Teknik sohbette:
> "kitap-kulubu/PLAN-HAREKET.md dosyasını oku ve X. adımı uygula."
>
> Son güncelleme: 2026-08-15 · Diğer planlardan bağımsız.

## Nereden çıktı

Kullanıcı motionsites.ai'deki **Velorah** adlı hero tasarımını gösterip
"buradan bir şey alabilir miyiz" diye sordu. Önizleme GIF'i indirilip 157
karesi incelendi (2026-08-15).

**Bulgu — bu not önemli, yanlış hatırlanmasın:** Velorah koyu cam/3B/neon bir
"ajans" tasarımı **değil**. Gerçekte:

- Tam sayfa (full-bleed) **elle çizilmiş hissi veren illüstrasyon**: gece mavisi
  yıldızlı gökyüzü, çiçek tarlası, kitap yığınları, sırtı dönük okuyan insanlar,
  sıcak sarı ışık lekeleri.
- Üstünde iri **serif** başlık, **karışık vurgulu**: bazı kelimeler parlak
  beyaz, bazıları soluk gri. Altında iki satır soluk açıklama, tek hap buton.
- **Tüm animasyon = arka plan resminde çok yavaş, döngüsel `scale`.** Metin,
  menü, buton tamamen sabit. Başka hiçbir hareket yok.

**Sonuç:** etkinin neredeyse tamamı **illüstrasyon + tipografi**den geliyor,
hareketten değil. Dolayısıyla "motion sitesi taklidi" yapmak yanlış hedef;
alınacak şey sunum dili.

## Görsel kararı — verildi (2026-08-15)

Velorah'ın gücü resminden geliyor, bizde öyle bir resim yoktu. Karar:

- **Kaynak: kamu malı tablo.** Üretilmiş (AI) görsel elendi — bir edebiyat
  kulübünde gerçek bir eser daha inandırıcı durur, üretilmiş görsel tanınıyor ve
  ucuz hissettiriyor. CSS dokusu da elendi (etkiyi vermiyor).
- **İşleniş: soluk, kâğıda karışan.** Koyu tam kaplama band elendi: hero'nun
  bittiği yerde kâğıt zeminli şeride sert kopuş oluyor ve koyu temada ayırt
  ediciliğini kaybediyor. Velorah'ta bu sorun yok çünkü orada **tüm sayfa** koyu
  — bizde sadece hero koyu olurdu.

Velorah'ın kendi görseli **kopyalanmayacak** — alınan şey fikir ve düzen,
dosya değil.

---

## Adım 1 — Hero tipografisi (görselden bağımsız, hemen yapılabilir)

**Seçim yapıldı (2026-08-15): "A · etiket + iri ad".** Üç seçenek mockup olarak
gösterildi; satır-içi karışık vurgu (Velorah'ın birebir taklidi) **elendi**,
çünkü bizim `h1`'imiz çıplak bir kitap adı — cümle değil, bölünemez.

Bunun yerine vurgu **kademeli koyuluk merdiveniyle** kurulur. Dört kademe,
yukarıdan aşağıya açılarak:

| Öğe | Renk | Biçim |
|---|---|---|
| Etiket (`.hero-eyebrow`) | `--muted` | versal, `--track-label`, küçük punto — mevcut hâli |
| Kitap adı (`h1`) | `--ink` | Fraunces, **`--fs-display`**, ağırlık 600, `letter-spacing: -0.02em` |
| Yazar (`.hero-author`) | `--ink-2` | Fraunces, ~19–20px |
| Açıklama (`.hero-desc`) | `--ink-3` | mevcut hâli (uzun anlatı için zaten tanımlı) |

**Tek gerçek değişiklik:** hero `h1`'i `--fs-h1`'den **`--fs-display`**'e çıkar
ve renk merdiveni netleşir. Yeni CSS değişkeni, yeni font, yeni paket **yok**.

> Sadece **ana sayfa hero'sunun** `h1`'i büyür — sitedeki diğer `h1`'ler
> (`index.css` içindeki genel `h1` kuralı) olduğu gibi kalır.

**Etiket metni:** `"Bu ayın kitabı · " + monthLabel(month)` → örn.
*"BU AYIN KİTABI · AĞUSTOS 2026"*. Mockup'ta sadece ay yazıyordu; ay tek başına
kalınca hero, o kitabın **neden** orada olduğunu söylemiyor. İkisi birlikte
duruyor.

**Kitap belli değilken** (mevcut "oylama sürüyor" hâli) aynı ilke geçerli:
etiket ve tanıtıcı sözler soluk, **adlar koyu**.
- `h1` cümle olduğu için `--fs-display`'e **çıkarılmaz**, `--fs-h1` kalır.
- "Şu an önde:" kısmı `--muted`, hemen ardındaki **kitap adı `--ink`**.

**Türkçe notu (elenen seçeneklerden kalan bilgi):** İleride cümle kurma
fikrine dönülürse, "Suç ve Ceza'yı okuyoruz" gibi **ek gerektiren** kalıplardan
kaçınılmalı — ek, son ünlüye ve kelimenin sesli/sessizle bitişine göre değişir
(*Ceza'yı, Sefiller'i, 1984'ü*) ve kodla üretmeye değmez. Belirtisiz nesne
kullanmak sorunu tamamen ortadan kaldırır: **"Suç ve Ceza okuyoruz"** her kitap
adıyla dilbilgisel olarak doğrudur.

**Neden önce bu:** en yüksek kazanç/risk oranına sahip madde. Tek başına deploy
edilip bakılmalı; sonucu görülmeden Adım 2 ve 3'e geçilmemeli.

## Adım 2 — Hero arkasına soluk tablo · ❌ DENENDİ VE VAZGEÇİLDİ

> **2026-08-16: Bu adım uygulandı, canlıda görüldü ve kullanıcı isteğiyle
> tamamen geri alındı.** Aşağısı arşiv amaçlı duruyor — tekrar denenecekse
> hangi kararların nasıl alındığı burada. Yeniden yapılmadan önce mutlaka
> konuşulmalı.
>
> Gerekçe: teknik bir sorun değildi. Kontrast ölçümleri geçiyordu (açık 5.23,
> koyu 4.68), tablo doğru seçilmişti, yerleşim çalışıyordu. Kullanıcı sadece
> **hero'nun arkasında fotoğraf olması fikrini** beğenmedi. Kutu, çerçeve ve
> ayraç sevmemesiyle tutarlı bir tercih.
>
> Uygulama `public/hero-arkaplan.webp` + `.hero::before` katmanı +
> `--hero-tablo-opaklik` değişkeniydi; hepsi geri alındı, kalıntı yok.



> Adım 1 canlıda görüldükten sonra yapılır. Tek bir dosya + birkaç satır CSS.

### Görselin seçimi (kod yazmadan önce)

- Kaynak **açık erişim müze koleksiyonları** olmalı: Met Museum Open Access,
  Rijksmuseum, National Gallery of Art — bunlar eseri açıkça CC0/kamu malı
  olarak işaretler. Rastgele bir görsel aramadan alınmaz; **lisans etiketi
  görülmeden indirilmez.**
- Konu: okuma, kitap, kütüphane, gece/lamba ışığı. Kulüple ilgisi olmalı.
- **Kompozisyon şartı:** `App.css`'te `.hero` bir **flex satırı** —
  `.hero-cover` **solda**, `.hero-text` **sağda**. Dolayısıyla eserin **sağ
  yarısı sakin** olmalı (metin oraya geliyor); sol yarısı yoğun/koyu olabilir,
  hatta iyidir — kitap kapağı da koyu ve oraya oturur.
  *(Bu madde 2026-08-15'te düzeltildi: önce "metin solda" varsayılmıştı, kod
  okununca tersi çıktı.)*
- Seçilen eserin adı, sanatçısı ve kaynak bağlantısı bu dosyaya not edilir
  (aşağıdaki boşluğa) — ileride "bu resim nereden geldi" sorusu doğmasın.

**Aramadan çıkan kural (2026-08-15):** "okuma" temalı eserlerin neredeyse hepsi
**dikey formatlı, yüzü baskın portrelerdir** (Corot, Manet, Rembrandt, Cassatt…).
Bunlar hero zemini olarak **uygun değil**: %40 opaklıkta bile bir yüz dikkat
dağıtır, üstelik dikey tablo geniş bir şeride kırpılınca kompozisyon dağılır.
Doğru tür **yatay, yüzsüz, atmosferik** eserdir — alacakaranlık manzarası,
lamba/kandil natürmortu, iç mekân. Ayrıca **baskı/gravür/karakalem elenmeli**
(Munch, Daubigny, Courbet örneklerinde olduğu gibi): bunlar kâğıt kenar
boşluklarıyla gelen sayfalardır, tam kaplama zemin olmaz.

> **SEÇİLDİ (2026-08-16): Jean-Baptiste-Camille Corot — _Landscape_ (1865/70)**
> Art Institute of Chicago, CC0 kamu malı — https://www.artic.edu/artworks/877
> IIIF görsel kimliği: `1501b057-0441-f1fa-e949-298b06ec6270`
>
> **Ayarlar:** sepya **%30**, opaklık **açık temada %45**, **koyu temada %40**.
>
> Opaklık göze göre değil **ölçülerek** belirlendi. Metin bölgesindeki en kötü
> kontrast (WCAG AA sınırı 4.5):
>
> | Opaklık | Açık | Koyu |
> |---|---|---|
> | %50 | 4.10 ✗ | 3.72 ✗ |
> | %45 | **4.83 ✓** | 4.30 ✗ |
> | %40 | 5.57 ✓ | **4.97 ✓** |
> | %35 | 6.45 ✓ | 5.79 ✓ |
>
> Yani açık temada %45 tavana yakındır — daha fazlası kontrastı düşürür.
> **Uyarıldın:** bu sayılar mockup üzerinden ölçüldü; gerçek sayfada yazı
> yerleşimi birebir aynı değil. Uygulandıktan sonra **yeniden ölçülmeli**.
>
> Kısa liste (hepsi kamu malı, Art Institute of Chicago, CC0):
> 1. **Jean-Baptiste-Camille Corot — Landscape** (1865/70), oran 1.67 —
>    https://www.artic.edu/artworks/877
>    *Gerçek hero düzeninde denendi (2026-08-15): koyu ağaç kütlesi solda kitap
>    kapağının arkasına, açık nehir tarafı sağda metnin arkasına düşüyor.
>    **Kırpma ya da aynalama gerekmiyor.** Şu an en güçlü aday.*
> 2. **John Frederick Peto — Lights of Other Days** (1906), oran 1.49 —
>    https://www.artic.edu/artworks/2156
> 3. **Jean-Charles Cazin — Landscape** (c. 1895), oran 1.26 —
>    https://www.artic.edu/artworks/874
> 4. **George Inness — Moonrise** (1891), **dikey** — palet uyumu en iyisi ama
>    kırpma gerektirir — https://www.artic.edu/artworks/64754
>
> Yüksek çözünürlüklü indirme kalıbı (IIIF):
> `https://www.artic.edu/iiif/2/<image_id>/full/1686,/0/default.jpg`
> AIC görselleri `AIC-User-Agent` başlığı olmadan **403** döner.

### Yerleşim

- Görsel hero'nun **arkasına** konur: **açık temada opaklık %45, koyu temada
  %40**, `sepia(0.30)` ile sıcak kâğıda uydurulur. (Gerekçe ve ölçüm tablosu
  yukarıda, "Seçilen eser" bölümünde.)
- **Opaklıktan önce gelen kural:** metnin arkasındaki bölge sakin kalmalı ve
  metin/zemin kontrastı **en az 4.5:1** ölçülmeli. Kontrast tutmuyorsa çözüm
  opaklığı düşürmek ya da görseli kaydırmaktır — metni açık renge çevirmek
  **değil** (o, elenen "koyu band" seçeneğine geri dönmek olur).
- **Koyu temada ayrı değer:** koyu zeminde aynı opaklık farklı görünür. Tek
  sayı iki temaya yetmez, tema başına ayrı ayarlanır (koyuda genelde daha
  düşük).
- Görsel **sadece hero bandının arkasında** durur ve hero'nun bittiği yerde
  **alta doğru sönerek kâğıda döner** (yaklaşık 180–200px'lik bir sönme).
  "Şimdiye kadar okuduklarımız" şeridi ve altındaki her şey temiz kâğıt
  zemindedir.
- Geçiş yumuşak olmalı. Bu projede daha önce kapak arkasındaki bordo parıltı
  **keskin geçiş yüzünden tamamen kaldırılmıştı** — aynı hataya düşülmemeli.
- **Dikkat:** `.hero-cover` üzerinde zaten `animation: heroFloat 6.5s` var
  (kapak süzülüyor). Adım 3'teki "yavaş yakınlaşma" eklenirken bununla
  çakışmamalı — iki ayrı ritim aynı anda göze çarparsa huzursuz eder.

### Korunacaklar

- **Hero'daki gerçek veri kaldırılmayacak.** Velorah'ın hero'su saf atmosferdir,
  bilgi taşımaz; bizimki bu ayın kitabını, kapağını, yazarını ve buluşma
  zamanını gösteriyor. Görsel bunların **arkasına** geçer, yerine değil.
- Adım 1'in koyuluk merdiveni aynen kalır (etiket `--muted` → ad `--ink` →
  yazar `--ink-2` → açıklama `--ink-3`).
- Sayfanın geri kalanı **kâğıt zeminde kalır**; sadece hero'nun arkasında doku
  vardır.

### Değiştirilebilir olmalı

Eser bir kere seçilip betona dökülmemeli — kullanıcı sonradan fikrini
değiştirebilir, mevsime göre değiştirmek isteyebilir. Bu yüzden:

- Görsel **tek bir sabit adla** durur: `public/hero-arkaplan.jpg`. Tabloyu
  değiştirmek = aynı adla başka bir dosya koymak. **Kod değişmez.**
- Opaklık `index.css`'te **CSS değişkeni** olur (örn. `--hero-tablo-opaklik`),
  açık ve koyu tema için ayrı ayrı tanımlanır. Şiddeti değiştirmek = tek sayı.
- Sepya/harman miktarı da aynı şekilde değişkene bağlanır.

Böylece "başka bir tablo deneyelim" isteği teknik sohbet gerektirmez.

**Deneme aracı:** karar vermeden önce adayları gerçek düzende denemek için
tek dosyalık bir sayfa hazırlandı (2026-08-15): dört tablo gömülü, opaklık ve
sepya kaydırıcıları, açık/koyu tema, kendi görselini yükleme. Proje dışında,
geçici. *Not: Art Institute'un IIIF sunucusu tarayıcıdan gelen düz istekleri
**403** ile reddediyor (`AIC-User-Agent` başlığı istiyor), bu yüzden görseller
sayfaya gömülmek zorunda — `<img src="https://artic.edu/...">` çalışmaz. Aynı
tuzak siteye görseli dışarıdan bağlamaya kalkarsak da geçerli; görsel
`public/` içinde kendimizde durmalı.*

### Teknik

- **GIF kesinlikle kullanılmayacak** (Velorah'ın önizlemesi 13 MB — o bir vitrin
  dosyası, üretim varlığı değil). Tek bir **WebP/AVIF**, hedef **300 KB altı**,
  `public/` içinde kendimiz barındırırız.
- CSP: görsel kendi alanımızdan servis edilirse `vercel.json`'daki `img-src`
  **değişmez**. Dış kaynaktan çekilirse oraya izin eklenmesi gerekir — tercih
  edilmez.
- `Cover` bileşenindeki kural burada da geçerli: **`loading="lazy"`
  kullanılmayacak** (bu projede resimleri askıya alıyor).
- Görsel yüklenemezse hero **bozulmamalı** — arkası sade kâğıt kalır, metin
  yerinde durur.

## Adım 3 — Hareket seti

Altı aday konuşuldu, **dördü kaldı.** Hepsi **saf CSS + IntersectionObserver**;
Framer Motion vb. paket **eklenmeyecek** — bu kadarı için bundle şişirmeye
değmez.

### 3a. Kademeli giriş · hero, sayfa ilk açıldığında

Hero metni sırayla alttan belirir: etiket → başlık → yazar → açıklama →
butonlar.

- Her öge `translateY(12px)` + `opacity: 0`'dan gelir, süre **500 ms**,
  yumuşama `cubic-bezier(.2, .7, .2, 1)` (projede zaten kullanılan eğri).
- Ögeler arası gecikme **60 ms**. Toplam ~800 ms; daha uzunu bekletme hissi verir.
- **Sadece ilk yüklemede**, rota değişiminde değil (o 3d'nin işi).
- **Kapak (`.hero-cover`) bu animasyona dahil değil** — üzerinde zaten
  `heroFloat` var, ikisi üst üste binerse kapak zıplıyormuş gibi görünür.

### 3b. Görünürken açılma · yalnızca "Şimdiye kadar okuduklarımız"

Şerit ekrana girince kapaklar sırayla belirir.

- `IntersectionObserver`, eşik 0.2, tetiklendikten sonra **`unobserve`** —
  yukarı aşağı kaydırdıkça tekrar tekrar oynamamalı.
- Kapaklar arası **70 ms**, süre **450 ms**.
- **Sadece bu bölümde.** Her bölüme koyulursa sayfa yorucu olur; sayfayı
  aşağı inerken sürekli bir şeylerin belirmesi huzursuz eder.

### 3c. Sayaç · kulüp sayacı

"14 kitap · 4.312 sayfa" görünür olunca 0'dan hedefe sayar.

- Süre **800 ms**, `easeOutCubic`, bir kez (3b ile aynı gözlemci).
- Sayılar `toLocaleString("tr-TR")` ile biçimlenir — binlik ayracı **nokta**
  olmalı (4.312), virgül değil.

### 3d. Sayfa geçişi · rota değişiminde

İçerik sert belirmek yerine **180 ms**'de `opacity` + 4px yükselerek gelir.

- Kısa tutulmalı. 300 ms üstü gezinmeyi ağır hissettirir; burada amaç fark
  edilmemek, sadece sertliği almak.

### Elenen ve bekleyen

- **Kayan şerit (marquee) — ELENDİ (2026-08-16, kesin).** Kulüp şeridi zaten
  elle yatay kaydırılıyor; kendiliğinden akan bir şeyi okumaya çalışmak sinir
  bozucu ve dokunmatikte kaydırmayla kavga ediyor. Kodda hiç yazılmadı.
- **Yavaş yakınlaşma — KONUSUZ KALDI.** Uygulanacağı arka plan görseli
  (Adım 2) geri alındığı için ortada yakınlaşacak bir şey yok.
- **Kapak süzülmesi (`heroFloat`) — KALDIRILDI (2026-08-16).** Kullanıcı
  isteğiyle silindi: sürekli oynayan bir öge hero'ya ikinci bir ritim
  katıyordu. Kapakta hareket artık yalnızca hover'da. Keyframes ve ölü
  `prefers-reduced-motion` kuralı da temizlendi.

**Sonuç: kalıcı (durmadan tekrar eden) hiçbir animasyon kalmadı.** Adım 3'teki
dört maddenin hepsi ya bir kez oynuyor ya da kullanıcı hareketine cevap
veriyor. Yeni bir sürekli animasyon önerilirse bu karara dönülmeli.

### Hepsi için zorunlu kurallar

- **`prefers-reduced-motion: reduce`** altında 3d tamamen kapanır; 3a, 3b, 3c
  anında son hâline atlar. Hareketi kapatmış kullanıcı hiçbir bilgi kaybetmez.
- **Başlangıç durumu CSS'te `opacity: 0` OLMAYACAK.** Gizleyen sınıf JS ile
  eklenmeli; aksi halde JS bir sebeple çalışmazsa (hata, eski tarayıcı) içerik
  kalıcı olarak görünmez kalır. Varsayılan hep "görünür" olmalı.
- Animasyonlar `transform` ve `opacity` ile sınırlı — `top`, `height`, `margin`
  gibi yerleşim tetikleyen özellikler kullanılmayacak.

## Yapılmayacaklar

Velorah'a bakarken çekici gelebilir ama bu siteye zarar verir:

- Camsı/bulanık paneller (glassmorphism) — kutu demektir, kullanıcı kutu sevmiyor
- 3B/WebGL sahne — ağır, mobilde pil yakar, bakım yükü
- Neon gradyan, parlama, otomatik oynayan video arka plan
- Sitenin tamamının koyulaştırılması — koyu tema zaten seçenek olarak var,
  varsayılan kâğıt zemin korunur
- Hero'daki gerçek verinin (bu ayın kitabı) atmosfer uğruna kaldırılması

## Kontrol listesi

- [ ] Adım 1 tek başına deploy edilip bakıldı mı? (Beğenilmezse burada durulur)
- [ ] Uzun kitap adı (örn. "Yüzyıllık Yalnızlık" / çok uzun bir ad) mobilde
      `--fs-display` ile taşmıyor, düzgün kırılıyor
- [ ] Kitap belli değilken hero hâlâ dengeli duruyor (`h1` büyütülmedi)
- [ ] Diğer sayfaların `h1` puntosu değişmedi
- [ ] Hareketler açık/koyu temada ve 4 paletin hepsinde bozulmuyor
- [ ] `prefers-reduced-motion` açıkken animasyonlar duruyor, içerik tam görünüyor
- [ ] Mobilde (375px) kare düşmesi yok, sayfa yana taşmıyor
- [ ] Hero görseli: boyut 300 KB altı, ilk yüklemede metin görselden önce
      okunabiliyor
- [ ] Görselin lisansı **açıkça** kamu malı/CC0 mı, künyesi plana yazıldı mı
- [ ] Metin/zemin kontrastı 4.5:1'i geçiyor (açık **ve** koyu temada ayrı ölçüm)
- [ ] Opaklık koyu temada ayrı ayarlandı, iki temada da doku fark ediliyor
- [ ] Görsel yüklenmediğinde hero bozulmuyor
- [ ] Görselin kenarında keskin geçiş yok
- [ ] Görseli değiştirmek gerçekten tek dosya değişimi mi (kod elleme yok)
- [ ] Opaklık CSS değişkeninde mi, iki tema için ayrı mı tanımlı
- [ ] JS kapalıyken/hata verdiğinde hiçbir içerik görünmez kalmıyor
- [ ] Görünürken açılma bir kez oynuyor, tekrar kaydırınca tekrarlamıyor
- [ ] Sayaçta binlik ayracı nokta (4.312)
- [ ] `prefers-reduced-motion` açıkken hepsi duruyor, içerik tam
- [ ] Klavyeyle gezinirken görünürken-açılan bölümler odağı kaçırmıyor
- [ ] Deploy: `kitap-kulubu` klasörünün içinde
      `vercel --prod --token=<TOKEN> --yes`

## Karar günlüğü

- **2026-08-15:** Velorah incelendi. Tarzın koyu/3B sanılması **yanlış çıktı**;
  gerçekte illüstrasyon + serif tipografi, tek yavaş `scale`. Alınacak şey
  hareket değil sunum dili olarak belirlendi. Sıra: önce tipografi (Adım 1),
  görsel kararı ayrıca verilecek.
- **2026-08-15:** Adım 1 için üç tipografi seçeneği mockup olarak sunuldu,
  **A (etiket + iri ad)** seçildi. Satır-içi karışık vurgu elendi: `h1` çıplak
  kitap adı olduğu için bölünemiyor. Vurgu, dört kademeli koyuluk merdiveniyle
  kuruluyor.
- **2026-08-15:** Adım 2 kararı verildi. Kaynak **kamu malı tablo** (AI görseli
  ve CSS dokusu elendi), işleniş **soluk/kâğıda karışan** (koyu tam kaplama
  band elendi — kâğıt zeminli şeride sert kopuş yaratıyor ve koyu temada
  sönüyor). Opaklık üç değerde karşılaştırıldı; %25 fazla siliktı, %52'de metnin
  arkası kalabalıklaştı.
- **2026-08-16:** Eser seçildi: **Corot — Landscape**. Kullanıcı deneme
  sayfasında %45 opaklık / %30 sepya belirledi. Kontrast ölçümü açık temada
  geçtiğini (4.83) ama **koyu temada kaldığını (4.30)** gösterdi → koyu tema
  için **%40** (4.97). Tema başına ayrı opaklık kuralı böylece sayıya bağlandı.
- **2026-08-16:** Adım 2 **uygulandı**. Ara not: bir teknik oturum önce planın
  tersini yapmıştı (uydurma `hero-gece.svg` + elenen koyu band + açık renk
  yazı); geri alındı. Doğru sürüm hero **kartının içine** `::before` katmanı
  olarak girdi — site bu arada kart diline geçtiği için tablo artık kâğıdın
  değil kartın zemini. Gerçek sayfada ölçülen kontrast: açık **5.23**, koyu
  **4.68** (koyuda %45 denenseydi 4.09 ile kalıyordu).
- **2026-08-16:** Adım 3 ayrıntılandırıldı: dört madde kaldı (kademeli giriş,
  görünürken açılma, sayaç, sayfa geçişi). **Kayan şerit elendi.**
- **2026-08-16 (aynı gün, kullanıcı canlıda gördükten sonra):** **Adım 2 geri
  alındı** — arka planda fotoğraf fikri beğenilmedi. **Kapak süzülmesi
  kaldırıldı.** Kayan şerit kesin olarak elendi. Böylece sitede sürekli tekrar
  eden animasyon kalmadı. Hero'ya görsel katma fikri kapanmadı ama farklı bir
  yönden düşünülecek — bu dosyada değil, yeni bir konuşmada.
