import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useDiscussion } from "../hooks/useDiscussion";
import { useQuotes } from "../hooks/useQuotes";
import type { Book, Shelf } from "../types";

// "Bu ay kulüpte": ayın kitabının hemen altında, bu ay kulüpte ne
// yapılabileceğini tek bakışta gösteren üç satırlık bir künye — okuma,
// tartışma, alıntı. Kart ya da pano değil: üç sütun, arada kılcal ayraç.
// Bütün sayılar gerçek kayıtlardan geliyor; sıfır ya da bilinmeyen sayı
// yazılmıyor, yerine davet cümlesi çıkıyor.
//
// Raflar HomePage'den geliyor: Ayın Kitabı'ndaki kulüp ilerlemesi aynı
// kitabın raflarını zaten dinliyor, burada ikinci bir onSnapshot açılmasın.
export default function BuAyKulupte({
  book,
  shelves,
}: {
  book: Book;
  shelves: Shelf[];
}) {
  const { currentUser } = useApp();
  const { questions, answersFor } = useDiscussion(book.id);
  const cevapSayisi = questions.reduce(
    (top, q) => top + answersFor(q.id).length,
    0
  );
  const { quotes } = useQuotes(book.id);

  const benim = currentUser
    ? shelves.find((s) => s.userId === currentUser.id)
    : undefined;

  // Okuma: yalnızca kişinin kendi raf kaydı. Ziyaretçide raflar okunamıyor.
  let okumaDurumu: string | null = null;
  let okumaYuzde: number | null = null;
  if (benim?.status === "reading") {
    okumaYuzde = benim.progress ?? 0;
    okumaDurumu = `İlerlemen %${okumaYuzde}`;
  } else if (benim?.status === "read") {
    okumaDurumu = "Bitirdin";
  } else if (benim?.status === "want") {
    okumaDurumu = "Okuma listende";
  } else if (currentUser) {
    okumaDurumu = "Henüz rafında değil";
  }

  // Tartışma: soru yoksa kitap sayfasında tartışma bölümü de görünmüyor
  // (Discussion yöneticiye değilse null döner) — o zaman sohbete yönlendir.
  const soruVar = questions.length > 0;
  const tartismaSayisi = soruVar
    ? [
        `${questions.length} soru`,
        // Cevaplar girişe bağlı; ziyaretçide sayı bilinmiyor, hiç yazılmıyor.
        currentUser && cevapSayisi > 0 && `${cevapSayisi} cevap`,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <section className="section bu-ay-bolum" aria-labelledby="bu-ay-baslik">
      <div className="section-head">
        <div>
          <h2 id="bu-ay-baslik">Bu ay kulüpte</h2>
          <p className="hint bu-ay-giris">
            Bu ay {book.title} etrafında birlikte okuyor, konuşuyor ve
            keşfediyoruz.
          </p>
        </div>
      </div>

      <ul className="bu-ay-liste">
        <li className="bu-ay-oge">
          <span className="bu-ay-etiket">
            <IkonKitap /> Okuma
          </span>
          <p className="bu-ay-cagri">Kitabı okumaya devam et</p>
          {okumaDurumu && <p className="bu-ay-durum">{okumaDurumu}</p>}
          {okumaYuzde !== null && (
            <span className="progress-track bu-ay-cubuk" aria-hidden="true">
              <span className="progress-fill" style={{ width: `${okumaYuzde}%` }} />
            </span>
          )}
          <Link to={`/kitap/${book.id}`} className="bu-ay-link">
            Kitap sayfasına git →
          </Link>
        </li>

        <li className="bu-ay-oge">
          <span className="bu-ay-etiket">
            <IkonKonusma /> Tartışmalar
          </span>
          <p className="bu-ay-cagri">Sen ne düşünüyorsun?</p>
          <p className="bu-ay-durum">
            {tartismaSayisi ?? "Bu ay için henüz soru açılmadı"}
          </p>
          {soruVar ? (
            <Link to={`/kitap/${book.id}#tartisma`} className="bu-ay-link">
              Sorulara katıl →
            </Link>
          ) : (
            <Link to="/sohbet" className="bu-ay-link">
              Sohbete katıl →
            </Link>
          )}
        </li>

        <li className="bu-ay-oge">
          <span className="bu-ay-etiket">
            <IkonAlinti /> Alıntılar
          </span>
          <p className="bu-ay-cagri">Bir cümle bırak.</p>
          <p className="bu-ay-durum">
            {quotes.length > 0
              ? `${quotes.length} alıntı paylaşıldı`
              : "İlk alıntıyı sen bırak"}
          </p>
          <Link to={`/kitap/${book.id}#alintilar`} className="bu-ay-link">
            Alıntılara git →
          </Link>
        </li>
      </ul>
    </section>
  );
}

// Küçük çizgi ikonlar — metin renginden (currentColor) boyanıyor, emoji
// yerine. Ekran okuyucuya gizli: yanındaki etiket zaten aynı şeyi söylüyor.
function Ikon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="bu-ay-ikon"
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IkonKitap() {
  return (
    <Ikon>
      <path d="M12 6.5C10.5 5.3 8.3 4.8 5 5v13c3.3-.2 5.5.3 7 1.5 1.5-1.2 3.7-1.7 7-1.5V5c-3.3-.2-5.5.3-7 1.5Z" />
      <path d="M12 6.5v13" />
    </Ikon>
  );
}

function IkonKonusma() {
  return (
    <Ikon>
      <path d="M20 12a7 7 0 0 1-10.3 6.2L5 19.5l1.3-4.2A7 7 0 1 1 20 12Z" />
    </Ikon>
  );
}

function IkonAlinti() {
  return (
    <Ikon>
      <path d="M9.5 8.5C7 9.2 5.5 11 5.5 13.8V16h4v-4H7.3c.2-1.3 1-2.2 2.2-2.6Z" />
      <path d="M18 8.5c-2.5.7-4 2.5-4 5.3V16h4v-4h-2.2c.2-1.3 1-2.2 2.2-2.6Z" />
    </Ikon>
  );
}
