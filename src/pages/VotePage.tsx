import { useMemo } from "react";
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
  const { votes, tally, myVote, leaderId, isOpen, castVote, finalize, reopen, election } =
    useVoting(month);
  const { books, authors, isAdmin, isMember, currentUser } = useApp();
  const { archive } = useSchedule();
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

  async function handleFinalize() {
    if (!leaderId) return;
    const leaderBook = books.find((b) => b.id === leaderId);
    const ok = window.confirm(
      `"${leaderBook?.title ?? "Bu kitap"}" bu ayın kitabı olarak kesinleştirilsin mi? Bu işlem oylamayı kapatır ve takvime yazar.`
    );
    if (!ok) return;
    await finalize();
  }

  async function handleReopen() {
    const ok = window.confirm("Oylama yeniden açılsın mı?");
    if (!ok) return;
    await reopen();
  }

  return (
    <div>
      <div className="section-head">
        <h1>Ayın kitabı oylaması</h1>
      </div>
      <p className="hint">{monthLabel(month)}</p>

      {!isOpen && winner && (
        <div className="cta-banner">
          Oylama kapandı — 🏆 Bu ayın kitabı:{" "}
          <Link to={`/kitap/${winner.id}`}>
            <strong>{winner.title}</strong>
          </Link>
        </div>
      )}

      {!isOpen && !winner && (
        <p className="hint" style={{ marginTop: "0.6rem" }}>
          Oylama kapandı.
        </p>
      )}

      {!currentUser && (
        <div className="cta-banner">
          Oy vermek için <Link to="/giris">giriş yap</Link>.
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Adaylar</h2>
          <span className="hint">
            {candidates.length} kitap · okunanlar listede yok
          </span>
        </div>
        {candidates.length === 0 && (
          <p className="empty">
            Aday kalmadı — hepsini okuduk! <Link to="/kitaplar">Yeni kitap öner →</Link>
          </p>
        )}
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
                  onClick={() => castVote(book.id)}
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
            Sonuçları görmek için <Link to="/giris">giriş yap</Link>.
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
