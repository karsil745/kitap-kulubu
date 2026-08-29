# Bibliyofili Kitap Kulübü

Arkadaş çevresiyle yürüyen küçük bir okuma kulübü için yazılmış web uygulaması.
Her ay birlikte bir kitap seçilir, okunur ve üzerine konuşulur.

Kulübün akışı şu: üyeler kitap **önerir** → ay için **oylanır** → kazanan kitap
takvime yazılır → o ay boyunca **okuma ilerlemesi**, **yorumlar**, **alıntılar**
ve **sohbet** aynı yerde birikir. Zamanla ortaya kulübün hafızası çıkar:
şimdiye kadar neler okunduğu, kimin ne dediği.

## Neler var

- **Ayın kitabı** — ana sayfada bu ay ne okuduğumuz ve ne zaman buluştuğumuz
- **Oylama** — aday kitaplar arasından ayın kitabının seçilmesi
- **Okuma şeridi** — kulübün geçmişi: bugüne kadar kaç kitap, kaç sayfa
- **Kitaplar ve yazarlar** — kapaklar Open Library'den geliyor
- **Yorum, puan ve alıntılar** — kitap sayfalarında birikir
- **Raflar ve rozetler** — kişisel okuma takibi
- **Sohbet odası** — üyelere özel, anlık mesajlaşma
- **Takvim** — geçmiş ve gelecek ayların programı
- **Günün sözü** — kulübün alıntılarından rastgele biri

Açık ve koyu tema var; hareketler `prefers-reduced-motion` ayarına saygı duyar.

## Teknoloji

React 19 · TypeScript · Vite · React Router · Firebase (Auth + Firestore).
Arayüz sade CSS ile yazıldı — animasyonlar dahil hiçbir yerde UI kütüphanesi
veya animasyon paketi kullanılmadı.

## Kurulum

```bash
npm install
cp .env.example .env.local   # Firebase değerlerini doldur
npm run dev
```

Firebase değerlerini **Firebase Console → Proje Ayarları → Web uygulaman**
bölümünden alırsın. `.env.local` git'e gönderilmez.

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run preview` | Derlemeyi yerelde sunar |
| `npm run lint` | Oxlint |
| `npm run rules` | Firestore kurallarını yayınlar |

## Yetkiler

Google hesabı olan herkes giriş yapabilir ama **giriş yapmak yazma yetkisi
vermez**. Üyelik bir yöneticinin onayıyla açılır, yöneticilik ise yalnızca
Firebase Console'dan elle verilir. Ayrıntılar: [GUVENLIK.md](GUVENLIK.md).

## Planlar

`PLAN-*.md` dosyaları yapılacak işlerin gerekçeleriyle birlikte tutulduğu
yerdir — sadece "ne yapılacak" değil, **neyin neden elendiği** de yazılır.
Yeni bir işe başlamadan önce ilgili planı okumak, aynı fikri ikinci kez
tartışmaktan kurtarır.

| Dosya | Durum |
|---|---|
| `PLAN-ANA-SAYFA-KULUP-SERIDI.md` | uygulandı |
| `PLAN-SOHBET-ODASI.md` | uygulandı, testleri bekliyor |
| `PLAN-ANIMASYON.md` | uygulandı, testleri bekliyor |
| `PLAN-KATILIM.md` | uygulandı |
| `PLAN-HAREKET.md` | kapandı — Adım 1 uygulandı, Adım 2 geri alındı, Adım 3 `PLAN-ANIMASYON.md`'ye taşındı |
| `PLAN-ANA-SAYFA-SADELESTIRME.md` | Adım 2·4·5 uygulandı; Adım 1 ve 3 bekliyor |
| `PLAN-ODALAR.md` | taslak |
