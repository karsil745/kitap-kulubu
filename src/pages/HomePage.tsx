import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
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

// Ana sayfanın tek bir işi var: bu ay ne okuyoruz, ne zaman buluşuyoruz.
// "En çok önerilenler" (/kitaplar'ın kopyasıydı) ve "Kulüpte neler oluyor"
// (artık sohbet akışının içinde) buradan kaldırıldı; bkz.
// PLAN-ANA-SAYFA-SADELESTIRME.md Adım 2, 4 ve 5.
export default function HomePage() {
  const { books, authors, currentUser } = useApp();
  const { current } = useSchedule();
  const month = currentMonth();
  const { leaderId, isOpen } = useVoting(month);
  const { gelenler } = useKatilim(month);

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
        <div className="hero-cover">
          {heroBook &&
            (botm ? (
              <Link to={`/kitap/${heroBook.id}`} className="hero-book">
                <Cover book={heroBook} />
              </Link>
            ) : (
              // Kesinleşmemiş aday: kapak biraz soluk, altında "şu an önde" notu
              <Link to="/oylama" className="hero-book hero-book-tentative">
                <Cover book={heroBook} />
              </Link>
            ))}
        </div>

        {/* Kapak bu animasyona dahil değil, olduğu yerde durur. */}
        <div className={heroGirisi ? "hero-text hero-giris" : "hero-text"}>
          {botm ? (
            <>
              {/* Ay tek başına, kitabın NEDEN orada olduğunu söylemiyor;
                  ikisi birlikte duruyor. */}
              <span className="hero-eyebrow">
                Bu ayın kitabı · {monthLabel(month)}
              </span>
              <h1 className="hero-title-book">{botm.title}</h1>
              <p className="hero-author">{botmAuthor?.name}</p>
              {gercekAciklama(botm.description) && (
                <p className="hero-desc">{gercekAciklama(botm.description)}</p>
              )}
              <div className="hero-cta">
                <Link to={`/kitap/${botm.id}`} className="btn-primary">
                  İncele →
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
                <Link to="/oylama" className="btn-primary">
                  Oylamaya katıl →
                </Link>
                <Link to="/kitaplar" className="hero-vote-link">
                  Kitap öner →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {!currentUser && (
        <div className="cta-banner">
          Kulübe katıl, kendi kitaplarını öner!{" "}
          <Link to="/giris">Giriş yap →</Link>
        </div>
      )}

      {/* Sayfanın hikâyesi: "bu ay ne okuyoruz → bugüne kadar neler okuduk"
          → sessiz kapanış. */}
      <ReadingHistory />

      <QuoteOfTheDay />
    </div>
  );
}
