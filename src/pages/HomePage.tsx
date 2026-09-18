import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useBookShelves } from "../hooks/useShelves";
import { useSchedule } from "../hooks/useSchedule";
import { useVoting } from "../hooks/useVoting";
import { useKatilim } from "../hooks/useKatilim";
import { currentMonth, monthLabel } from "../lib/month";
import { gercekAciklama } from "../lib/text";
import { bulusmaEtiketi } from "../lib/time";
import Cover from "../components/Cover";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import ReadingHistory from "../components/ReadingHistory";

// Hero giriş animasyonu oturumda BİR KEZ oynar. Modül düzeyinde tutuluyor:
// ana sayfaya her dönüşte bileşen yeniden kurulur, bu bayrak kurulmaz.
let heroGirisiOynadi = false;

// Kulüp okuma ilerlemesi — gerçek raf kayıtlarından (shelves) hesaplanır,
// ayrı bir koleksiyon yok. Kitabı "okuyorum" ya da "okudum" diye rafına almış
// üyelerin ortalaması: okuyanın kendi yüzdesi, bitirenin %100'ü.
// Raflar girişe bağlı: ziyaretçide dinleyici açılmaz, sayı yerine davet çıkar.
function KulupIlerlemesi({ bookId }: { bookId: string }) {
  const { currentUser } = useApp();
  const shelves = useBookShelves(bookId);

  const okuyan = shelves.filter((s) => s.status === "reading").length;
  const bitiren = shelves.filter((s) => s.status === "read").length;
  const katilan = okuyan + bitiren;
  const yuzde =
    katilan > 0
      ? Math.round(
          shelves.reduce(
            (top, s) =>
              top +
              (s.status === "read"
                ? 100
                : s.status === "reading"
                  ? (s.progress ?? 0)
                  : 0),
            0
          ) / katilan
        )
      : 0;

  return (
    <div className="kulup-ilerleme">
      <div className="kulup-ilerleme-bas">
        <span className="kulup-ilerleme-etiket">Kulüp okuma ilerlemesi</span>
        {katilan > 0 && <span className="kulup-ilerleme-yuzde">%{yuzde}</span>}
      </div>
      <span
        className="progress-track kulup-ilerleme-cubuk"
        role="progressbar"
        aria-label="Kulüp okuma ilerlemesi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={yuzde}
      >
        <span className="progress-fill" style={{ width: `${yuzde}%` }} />
      </span>
      <p className="kulup-ilerleme-not">
        {!currentUser ? (
          <>
            Kulübün bu kitapta nerede olduğunu görmek için{" "}
            <Link to="/giris" state={{ from: `/kitap/${bookId}` }}>
              giriş yap
            </Link>
            .
          </>
        ) : katilan === 0 ? (
          <>
            Henüz kimse okumaya başlamadı.{" "}
            <Link to={`/kitap/${bookId}`}>Rafına ekleyen ilk sen ol →</Link>
          </>
        ) : (
          [okuyan > 0 && `${okuyan} üye okuyor`, bitiren > 0 && `${bitiren} üye bitirdi`]
            .filter(Boolean)
            .join(" · ")
        )}
      </p>
    </div>
  );
}

// Ana sayfanın tek bir işi var: bu ay ne okuyoruz, ne zaman buluşuyoruz.
// "En çok önerilenler" (/kitaplar'ın kopyasıydı) ve "Kulüpte neler oluyor"
// (artık sohbet akışının içinde) buradan kaldırıldı; bkz.
// PLAN-ANA-SAYFA-SADELESTIRME.md Adım 2, 4 ve 5.
export default function HomePage() {
  const { books, authors, currentUser, veriDurumu } = useApp();
  const { current, durum: takvimDurumu } = useSchedule();
  const month = currentMonth();
  const { leaderId, isOpen } = useVoting(month);
  const { gelenler } = useKatilim(month);

  // Veri gelmeden hero "Bu ayın kitabı henüz belli değil" diyordu — ölçümde
  // 909ms boyunca, üstelik o ayın kitabı belliyken. Boş liste "kayıt yok"
  // değil "henüz bilmiyorum" demek; ikisi ayrıldı.
  const veriBekleniyor =
    veriDurumu === "yukleniyor" || takvimDurumu === "yukleniyor";
  const veriHatasi = veriDurumu === "hata" || takvimDurumu === "hata";

  // Sınıf JS ile ekleniyor; JS çalışmazsa metin animasyonsuz ama görünür kalır.
  const [heroGirisi, setHeroGirisi] = useState(false);
  useEffect(() => {
    if (heroGirisiOynadi) return;
    heroGirisiOynadi = true;
    setHeroGirisi(true);
  }, []);

  // Bu ayın kitabı SADECE takvimde kesinleşmiş bir kayıt varsa bellidir.
  // Yoksa uydurma bir kitap göstermek yerine "oylama sürüyor" hâline geçeriz —
  // aksi halde ana sayfa ile /takvim birbiriyle çelişir.
  const botm = current ? books.find((b) => b.id === current.bookId) ?? null : null;
  const botmAuthor = authors.find((a) => a.id === botm?.authorId);

  // Oylama sürerken hero'da şu an önde giden adayın kapağını gösteririz.
  const leader = leaderId ? books.find((b) => b.id === leaderId) ?? null : null;
  const heroBook = botm ?? leader;

  return (
    <div>
      <section className="hero">
        {/* Kapak yokken sarmalayıcı da basılmaz: boş bir esnek öge, `gap`
            kadar hayalet bir girinti bırakıp metni bölüm başlıklarından
            farklı bir sol kenara itiyordu. */}
        {heroBook && (
          // Sahne: kapağın arkasında, kapağın kendi renklerinden gelen çok
          // hafif bir yıkama. Kartın tamamına görsel koymak 2026-08-16'da
          // denenip geri alındı (PLAN-HAREKET.md); bu yalnızca kapak sütununda
          // kalıyor, metnin zemini ve kontrastı değişmiyor.
          <div
            className={botm ? "hero-cover hero-sahne" : "hero-cover"}
            style={
              botm && heroBook.coverImage
                ? ({ "--sahne-kapak": `url("${heroBook.coverImage}")` } as CSSProperties)
                : undefined
            }
          >
            {botm ? (
              <Link to={`/kitap/${heroBook.id}`} className="hero-book">
                <Cover book={heroBook} />
              </Link>
            ) : (
              // Kesinleşmemiş aday: kapak biraz soluk, altında "şu an önde" notu
              <Link to="/oylama" className="hero-book hero-book-tentative">
                <Cover book={heroBook} />
              </Link>
            )}
          </div>
        )}

        {/* Kapak bu animasyona dahil değil, olduğu yerde durur. */}
        <div className={heroGirisi ? "hero-text hero-giris" : "hero-text"}>
          {veriBekleniyor || veriHatasi ? (
            <>
              <span className="hero-eyebrow">{monthLabel(month)}</span>
              <p className="hero-desc">
                {veriHatasi
                  ? "Kulübün verileri yüklenemedi. Bağlantını kontrol edip sayfayı yenile."
                  : "Yükleniyor…"}
              </p>
            </>
          ) : botm ? (
            <>
              {/* Ay tek başına, kitabın NEDEN orada olduğunu söylemiyor;
                  ikisi birlikte duruyor. */}
              <span className="hero-eyebrow">
                <span className="hero-eyebrow-vurgu">Bu ayın kitabı</span> ·{" "}
                {monthLabel(month)}
              </span>
              <h1 className="hero-title-book">{botm.title}</h1>
              <p className="hero-author">{botmAuthor?.name}</p>
              {gercekAciklama(botm.description) && (
                <p className="hero-desc">{gercekAciklama(botm.description)}</p>
              )}
              <KulupIlerlemesi bookId={botm.id} />
              <div className="hero-cta">
                <Link to={`/kitap/${botm.id}`} className="btn-primary hero-cta-ana">
                  Kitabı incele →
                </Link>
                <Link to="/takvim" className="hero-vote-link">
                  Okuma takvimi →
                </Link>
              </div>
              {/* Buluşma yaklaşıyorsa ana sayfada da görünsün */}
              {current?.meetingAt && current.meetingAt > Date.now() && (
                <p className="hero-meeting">
                  Buluşma · {bulusmaEtiketi(current.meetingAt)}
                  {/* Sayı 0 ise hiç yazma — boş sayı kimseyi teşvik etmez */}
                  {gelenler.length > 0 && ` · ${gelenler.length} kişi geliyor`}
                </p>
              )}
            </>
          ) : (
            <>
              <span className="hero-eyebrow">
                {monthLabel(month)} · {isOpen ? "Oylama sürüyor" : "Oylama kapandı"}
              </span>
              <h1>Bu ayın kitabı henüz belli değil</h1>
              {leader && (
                <p className="hero-author">
                  Şu an önde:{" "}
                  <span className="hero-leader-name">{leader.title}</span>
                </p>
              )}
              <p className="hero-desc">
                Adaylar arasından sen de seç — en çok oyu alan kitap bu ay
                birlikte okunacak.
              </p>
              <div className="hero-cta">
                {/* Ziyaretçide sayfanın en büyük butonu doğrudan oylamaya
                    götürüyordu; orada bütün düğmeler sönük olduğu için en
                    güçlü çağrı iki tık sonra "önce giriş yap"la bitiyordu.
                    Artık giriş adımından geçip oylamaya çıkıyor. */}
                {currentUser ? (
                  <Link to="/oylama" className="btn-primary">
                    Oylamaya katıl →
                  </Link>
                ) : (
                  <Link
                    to="/giris"
                    state={{ from: "/oylama" }}
                    className="btn-primary"
                  >
                    Oylamaya katıl →
                  </Link>
                )}
                <Link to="/kitaplar" className="hero-vote-link">
                  Kitap öner →
                </Link>
              </div>
            </>
          )}

          {/* Ziyaretçi bandı hero'nun İÇİNDE duruyor: dışarıdayken hero ile
              geçmiş bölümünün arasına üçüncü bir yüzey giriyor ve ayrı bir
              bölüm gibi okunuyordu (PLAN-ANA-SAYFA-SADELESTIRME Adım 1). */}
          {!currentUser && (
            <div className="cta-banner">
              Kulübe katıl, kendi kitaplarını öner!{" "}
              <Link to="/giris" state={{ from: "/kitaplar" }}>
                Giriş yap →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Sayfanın hikâyesi: "bu ay ne okuyoruz → bugüne kadar neler okuduk"
          → sessiz kapanış. */}
      <ReadingHistory />

      <QuoteOfTheDay />
    </div>
  );
}
