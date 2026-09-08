import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useVoting } from "../hooks/useVoting";
import { useSchedule } from "../hooks/useSchedule";
import { usePageTitle } from "../hooks/usePageTitle";
import { currentMonth, monthLabel } from "../lib/month";
import Cover from "../components/Cover";
import VoteTally from "../components/VoteTally";

// Ayın kitabı oylaması: tüm üyeler aday kitaplardan birine oy verir,
// yönetici oylamayı kesinleştirince kazanan okuma takvimine yazılır.
export default function VotePage() {
  const month = currentMonth();
  const { votes, tally, myVote, leaderId, isOpen, castVote, finalize, reopen, election, durum: oylamaDurumu } =
    useVoting(month);
  const { books, authors, isAdmin, isMember, currentUser, veriDurumu } = useApp();
  const { archive, durum: takvimDurumu } = useSchedule();
  usePageTitle("Ayın Kitabı Oylaması");

  // Geçmiş aylarda okunmuş kitaplar aday olmaz — yoksa liste her ay şişer ve
  // zaten okuduğumuz kitaplar oyu böler.
  const readBookIds = useMemo(
    () => new Set(archive.filter((e) => e.month !== month).map((e) => e.bookId)),
    [archive, month]
  );
  const candidates = useMemo(
    () => books.filter((b) => !readBookIds.has(b.id)),
    [books, readBookIds]
  );

  const winner = election?.winnerBookId
    ? books.find((b) => b.id === election.winnerBookId)
    : null;

  // Seçim belgesi gelmeden `isOpen` true kabul ediliyor ve aday listesi boş
  // oluyor: sayfa ~690ms "oylama sürüyor, aday kalmadı" diyordu, oysa oylama
  // kapanmıştı ve bir kazanan vardı. "Henüz bilmiyorum" ayrı bir durum.
  const veriBekleniyor =
    veriDurumu === "yukleniyor" ||
    takvimDurumu === "yukleniyor" ||
    oylamaDurumu === "yukleniyor";
  const veriHatasi =
    veriDurumu === "hata" || takvimDurumu === "hata" || oylamaDurumu === "hata";

  // Yazma hataları eskiden hiçbir yere düşmüyordu: üye butona basıyor,
  // buton değişmiyor, sebep yok. Tek bir satırda toplanıyor.
  const [yazmaHatasi, setYazmaHatasi] = useState("");

  async function oyVer(bookId: string) {
    setYazmaHatasi("");
    try {
      await castVote(bookId);
    } catch (err) {
      console.error("Oy verilemedi:", err);
      setYazmaHatasi("Oyun kaydedilemedi, tekrar dene.");
    }
  }

  async function handleFinalize() {
    if (!leaderId) return;
    const leaderBook = books.find((b) => b.id === leaderId);
    const ok = window.confirm(
      `"${leaderBook?.title ?? "Bu kitap"}" bu ayın kitabı olarak kesinleştirilsin mi? Bu işlem oylamayı kapatır ve takvime yazar.`
    );
    if (!ok) return;
    setYazmaHatasi("");
    try {
      await finalize();
    } catch (err) {
      console.error("Kesinleştirilemedi:", err);
      setYazmaHatasi("Oylama kesinleştirilemedi, tekrar dene.");
    }
  }

  async function handleReopen() {
    const ok = window.confirm("Oylama yeniden açılsın mı?");
    if (!ok) return;
    setYazmaHatasi("");
    try {
      await reopen();
    } catch (err) {
      console.error("Yeniden açılamadı:", err);
      setYazmaHatasi("Oylama yeniden açılamadı, tekrar dene.");
    }
  }

  return (
    <div>
      <div className="section-head">
        <h1>Ayın kitabı oylaması</h1>
      </div>
      <p className="hint">{monthLabel(month)}</p>

      {veriBekleniyor && <p className="empty">Yükleniyor…</p>}
      {veriHatasi && (
        <p className="hint error">
          Oylama bilgileri yüklenemedi. Bağlantını kontrol edip sayfayı yenile.
        </p>
      )}

      {!veriBekleniyor && !isOpen && winner && (
        <div className="cta-banner">
          Oylama kapandı — 🏆 Bu ayın kitabı:{" "}
          <Link to={`/kitap/${winner.id}`}>
            <strong>{winner.title}</strong>
          </Link>
        </div>
      )}

      {!veriBekleniyor && !isOpen && !winner && (
        <p className="hint" style={{ marginTop: "0.6rem" }}>
          Oylama kapandı.
        </p>
      )}

      {/* Sönük "Oy Ver" butonlarının sebebi burada duruyor. Onay bekleyen üye
          için de yazılıyor: eskiden sebep yalnızca sayfanın en üstündeki genel
          banner'daydı, aday listesinde biraz kaydırınca ekrandan çıkıyor ve
          geriye sadece çalışmayan buton kalıyordu. */}
      {!currentUser && (
        <div className="cta-banner">
          Oy vermek için{" "}
          <Link to="/giris" state={{ from: "/oylama" }}>
            giriş yap
          </Link>
          .
        </div>
      )}
      {currentUser && !isMember && (
        <div className="cta-banner">
          Oy verebilmek için üyeliğinin kulüp yöneticisi tarafından onaylanması
          gerekiyor.
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Adaylar</h2>
          <span className="hint">
            {veriBekleniyor ? "…" : candidates.length} kitap · okunanlar listede yok
          </span>
        </div>
        {/* Yüklenirken boş liste "hepsini okuduk" diye kutlanıyordu. */}
        {!veriBekleniyor && !veriHatasi && candidates.length === 0 && (
          <p className="empty">
            Aday kalmadı — hepsini okuduk! <Link to="/kitaplar">Yeni kitap öner →</Link>
          </p>
        )}
        {yazmaHatasi && <p className="hint error">{yazmaHatasi}</p>}
        <div className="vote-candidates">
          {candidates.map((book) => {
            const author = authors.find((a) => a.id === book.authorId);
            const isMine = myVote === book.id;
            const disabled = !isOpen || !isMember;
            return (
              <div key={book.id} className="vote-candidate-row">
                <div className="vote-candidate-cover">
                  <Cover book={book} className="cover-emoji" />
                </div>
                <div className="vote-candidate-info">
                  <Link to={`/kitap/${book.id}`} className="vote-candidate-title">
                    {book.title}
                  </Link>
                  <p className="book-author">{author?.name ?? "Bilinmeyen yazar"}</p>
                </div>
                <button
                  className={isMine ? "btn-primary active" : "btn-primary"}
                  disabled={disabled}
                  onClick={() => oyVer(book.id)}
                >
                  {isMine ? "✓ Oyun" : "Oy Ver"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <h2>Canlı sonuçlar</h2>
        {/* Oylar üyelere özel — ziyaretçiye "0 oy" göstermek yanıltıcı olur. */}
        {currentUser ? (
          <VoteTally tally={tally} books={books} leaderId={leaderId} totalVotes={votes.length} />
        ) : (
          <p className="empty">
            Sonuçları görmek için{" "}
            <Link to="/giris" state={{ from: "/oylama" }}>
              giriş yap
            </Link>
            .
          </p>
        )}
      </section>

      {isAdmin && isOpen && (
        <section className="section">
          <button className="btn-primary" disabled={!leaderId} onClick={handleFinalize}>
            Kazananı Kesinleştir
          </button>
        </section>
      )}

      {isAdmin && !isOpen && (
        <section className="section">
          <button className="btn-ghost" onClick={handleReopen}>
            Yeniden Aç
          </button>
        </section>
      )}
    </div>
  );
}
