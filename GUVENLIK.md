# Güvenlik notları

## Yetki modeli

Firebase Auth'ta Google girişi herkese açık — **Google hesabı olan herkes giriş
yapabilir**. Bu yüzden "giriş yapmış olmak" hiçbir yazma yetkisi vermez.
Yetkiler `users/{uid}` belgesindeki iki alandan gelir:

| Alan | Ne yapar | Nasıl verilir |
|---|---|---|
| `approved: true` | Kulüp üyesi: kitap önerir, oy verir, yorum/alıntı/raf yazar | **Yönetici, Profil sayfasındaki "Üyelik onayları" listesinden** |
| `role: "admin"` | Yönetici: kitap siler, oylamayı kesinleştirir, içerik senkronu yapar, üye onaylar (üyelik de otomatik) | **Sadece Firebase Console'dan elle** |

Kimse kendi kendini üye ya da yönetici yapamaz. Sıradan bir üye kendi
belgesinde yalnızca `name/avatar/photo/bio` alanlarına dokunabilir. Yönetici
başkasının belgesinde **yalnızca `approved`** alanını değiştirebilir — yani
uygulama üzerinden yeni yönetici üretilemez, `role` hâlâ elle verilir.

Onaylanmamış biri siteyi gezebilir ama hiçbir şey yazamaz; uygulama ona
"üyeliğin onay bekliyor" bandını gösterir.

### Yeni üye onaylama

1. Kişi siteye girip Google ile bir kez giriş yapar (profil belgesi oluşur).
2. Yönetici olarak **/profil** sayfasını aç → **Üyelik onayları**.
3. Kişinin satırındaki **Onayla** butonuna bas.
4. Kişi sayfayı yenilesin.

Aynı listeden onay geri de alınabilir. Kendi onayını kaldıramazsın (kendini
kilitlememen için hem arayüz hem `setApproved` bunu engeller).

> Bu liste `firestore.rules`'taki yönetici-`approved` kuralına bağlı. Kural
> yayınlanmamışsa buton "Yazılamadı" uyarısı verir — o zaman kuralları Console'a
> yayınla (aşağı bak) ya da geçici olarak `approved: true`'yu Console'dan elle gir.

## Okuma izinleri

Giriş yapmamış ziyaretçi kitapları, açıklamaları, yorum metinlerini ve alıntı
metinlerini görebilir. **Üye listesi, profil fotoğrafları ve oylar giriş
gerektirir** — bunlar üyelerin gerçek adlarını ve kimin neye oy verdiğini
içeriyor. Ziyaretçide öneren/alıntı sahibi adları "Bilinmeyen üye" görünür;
bu kasıtlı.

## Kural değişikliği yayınlama

`firestore.rules` **elle** Firebase Console → Firestore Database → Kurallar
sekmesine yapıştırılıp "Yayınla" denmeli (projede firebase CLI yok).

> **Sıra önemli:** Yayınlamadan önce mevcut tüm üyelere `approved: true`
> eklenmiş olmalı. Aksi halde sen dahil herkes yazma yetkisini kaybeder.

## CSP (vercel.json)

`vercel.json` içindeki `Content-Security-Policy` başlığı harici kaynakları
kısıtlar. Dikkat edilecek iki nokta:

- `covers.openlibrary.org` bazı kapaklarda **archive.org'a yönlendiriyor**;
  tarayıcı yönlendirmenin hedefini de denetlediği için `img-src` içinde
  `archive.org` da bulunmak zorunda. Silinirse kapakların bir kısmı kaybolur.
- Google girişi `*.firebaseapp.com` üzerinde gizli bir iframe açıyor —
  `frame-src` girdisi kaldırılırsa giriş bozulur.

CSP'yi yerelde denemek için: `npm run build`, sonra `dist/index.html`'e aynı
politikayı geçici bir `<meta http-equiv="Content-Security-Policy">` olarak
ekleyip `npm run preview` ile aç, konsolu izle. (`frame-ancestors` meta
etiketinde çalışmaz, onu Vercel başlığı halleder.)

## Kapak URL'leri

`books.coverImage` yalnızca `https://covers.openlibrary.org/...` olabilir —
kural bunu zorluyor. Serbest bırakılırsa kapak alanı, siteyi açan herkesin
IP adresini saldırgana gönderen bir izleme pikseline dönüştürülebilir.

## Kapsam dışı kalan / bilinçli kabul edilenler

- **Firebase `apiKey` gizli değildir**, bundle'da görünür — normaldir.
  Güvenlik tamamen Firestore kurallarına dayanır.
- **App Check kurulmadı.** Kurulursa API'nin yalnızca gerçek siteden
  çağrılması zorlanır (bot/kota suistimaline karşı). Console → App Check →
  reCAPTCHA v3 ile eklenebilir.
- **Giriş `signInWithPopup` kullanıyor**; uygulama içi tarayıcılarda
  (Instagram/WhatsApp) popup engellenirse redirect'e düşer ve vercel.app ↔
  firebaseapp.com alan farkı yüzünden oturum kurulamaz. Kalıcı çözüm kendi
  alan adı üzerinden auth (reverse-proxy).
