import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useSchedule } from "../hooks/useSchedule";
import { usePageTitle } from "../hooks/usePageTitle";
import { monthLabel } from "../lib/month";
import Cover from "../components/Cover";
import Meeting from "../components/Meeting";
import { currentMonth } from "../lib/month";
import { sayfaSayilariniGetir } from "../lib/pages";
import { syncAllContent } from "../data/pastBooks";

// Okuma takvimi: bu ay okunan kitap + geçmiş ayların arşivi.
// Kayıtlar oylama kesinleştiğinde (veya yönetici elle) yazılır.
export default function CalendarPage() {
  const { current, archive } = useSchedule();
  const { books, authors, isAdmin, currentUser } = useApp();
  const [synced, setSynced] = useState(false);
  const [sayfaDurum, setSayfaDurum] = useState<string | null>(null);
  usePageTitle("Okuma Takvimi");

  const sayfasiz = books.filter((b) => !b.pages).length;

  // Sayfa sayısı olmayan kitapları Open Library'den tamamlar. Sayfa sayısı
  // bilinen kitaplarda okuma ilerlemesi yüzde yerine sayfayla girilir.
  async function handlePages() {
    setSayfaDurum("Aranıyor…");
    const { denenen, bulunan } = await sayfaSayilariniGetir(books, authors);
    setSayfaDurum(`${denenen} kitap tarandı, ${bulunan} tanesi bulundu.`);
  }

  const currentBook = current ? books.find((b) => b.id === current.bookId) : null;
  const currentAuthor = currentBook ? authors.find((a) => a.id === currentBook.authorId) : null;

  const pastEntries = archive.filter((e) => e.id !== current?.id);

  // Yönetici içerik senkronizasyonu: geçmiş kitapları arşive ekler ve tüm
  // kitap/yazar açıklamalarını content.ts'teki zengin metinlerle günceller.
  // Tekrar tekrar çalıştırılabilir (idempotent), bu yüzden kutu her zaman görünür.
  async function handleSync() {
    if (!currentUser) return;
    if (
      !window.confirm(
        "Kulübün okuduğu kitaplar arşive eklenecek ve tüm kitap/yazar açıklamaları güncellenecek. Devam edilsin mi?"
      )
    )
      return;
    await syncAllContent(currentUser.id);
    setSynced(true);
  }

  return (
    <div>
      <h1>Okuma takvimi</h1>

      {isAdmin && (
        <div className="admin-box">
          <p>Okunan kitapları arşive ekler ve tüm açıklama/biyografileri günceller.</p>
          <button className="btn-primary" onClick={handleSync}>
            Kitap içeriklerini kur & güncelle
          </button>
          {synced && <p className="hint">Güncellendi ✓</p>}

          {sayfasiz > 0 && (
            <>
              <p>
                {sayfasiz} kitapta sayfa sayısı yok — okuma ilerlemesi onlarda
                sayfa yerine yüzdeyle giriliyor.
              </p>
              <button className="btn-ghost" onClick={handlePages}>
                Sayfa sayılarını getir
              </button>
            </>
          )}
          {sayfaDurum && <p className="hint">{sayfaDurum}</p>}
        </div>
      )}

      <section className="section">
        <h2>Bu ay okuyoruz</h2>
        {currentBook ? (
          <Link to={`/kitap/${currentBook.id}`} className="book-card calendar-current-card">
            <div className="book-cover">
              <Cover book={currentBook} className="cover-emoji" />
            </div>
            <div className="book-info">
              <span className="era-tag">{currentBook.era}</span>
              <h3>{currentBook.title}</h3>
              <p className="book-author">{currentAuthor?.name ?? "Bilinmeyen yazar"}</p>
              {current?.note && <p className="hint">{current.note}</p>}
            </div>
          </Link>
        ) : (
          <p className="empty">
            Bu ay için kitap henüz belirlenmedi. <Link to="/oylama">Oylamaya katıl →</Link>
          </p>
        )}

        {currentBook && (
          <Meeting
            month={current?.month ?? currentMonth()}
            meetingAt={current?.meetingAt}
            bookTitle={currentBook.title}
          />
        )}
      </section>

      <section className="section">
        <h2>Geçmiş aylar</h2>
        {pastEntries.length === 0 ? (
          <p className="empty">Henüz arşiv yok.</p>
        ) : (
          <div className="calendar-archive">
            {pastEntries.map((entry) => {
              const book = books.find((b) => b.id === entry.bookId);
              return (
                <Link
                  key={entry.id}
                  to={book ? `/kitap/${book.id}` : "/kitaplar"}
                  className="calendar-archive-row"
                >
                  <span className="calendar-archive-month">{monthLabel(entry.month)}</span>
                  {book && (
                    <div className="calendar-archive-cover">
                      <Cover book={book} className="cover-emoji" />
                    </div>
                  )}
                  <span className="calendar-archive-title">
                    {book?.title ?? "Bilinmeyen kitap"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
