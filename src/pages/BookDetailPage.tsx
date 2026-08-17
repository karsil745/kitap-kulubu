import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import Cover from "../components/Cover";
import StarRating from "../components/StarRating";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import ShelfPicker from "../components/ShelfPicker";
import Avatar from "../components/Avatar";
import QuoteList from "../components/QuoteList";
import ReadingProgress from "../components/ReadingProgress";
import Discussion from "../components/Discussion";
import { useReviews } from "../hooks/useReviews";
import { useQuotes } from "../hooks/useQuotes";
import { gercekAciklama } from "../lib/text";

// Tek bir kitabın detay sayfası: açıklama, yazar tanıtımı, öneri butonu
// ve puan/yorum bölümü.
export default function BookDetailPage() {
  const { id } = useParams();
  const {
    books,
    currentUser,
    isMember,
    toggleRecommend,
    users,
    authors,
    isAdmin,
    deleteBook,
    updateBook,
  } = useApp();
  const navigate = useNavigate();
  // Kitap bulunamasa bile hook'lar koşulsuz çağrılmalı — id yoksa boş dizeyle çalışır.
  const { reviews, myReview, average, count, submit, remove, removeById } =
    useReviews(id ?? "");
  const {
    quotes,
    add: addQuote,
    remove: removeQuote,
    toggleLike: toggleQuoteLike,
  } = useQuotes(id ?? "");

  const book = books.find((b) => b.id === id);
  usePageTitle(book?.title);

  if (!book) {
    return (
      <div className="section">
        <p className="empty">Kitap bulunamadı.</p>
        <Link to="/kitaplar" className="link-more">
          ← Kitaplara dön
        </Link>
      </div>
    );
  }

  const author = authors.find((a) => a.id === book.authorId);
  const iRecommend = currentUser
    ? book.recommendedBy.includes(currentUser.id)
    : false;

  // Bu kitabı öneren üyelerin isimleri
  const recommenders = book.recommendedBy
    .map((uid) => users.find((u) => u.id === uid))
    .filter(Boolean);

  return (
    <div className="section detail">
      <Link to="/kitaplar" className="link-more">
        ← Kitaplara dön
      </Link>

      {/* Giriş çağrısı sayfada üç ayrı yerde tekrar etmesin — tek satırda topla */}
      {!currentUser && (
        <p className="hint detail-login-hint">
          Puan vermek, öneri yapmak ve alıntı eklemek için{" "}
          <Link to="/giris">giriş yap</Link>.
        </p>
      )}

      <div className="detail-head">
        <div className="detail-cover">
          <Cover book={book} />
        </div>
        <div className="detail-meta">
          <span className="era-tag">{book.era}</span>
          <h1>{book.title}</h1>
          <p className="detail-author">
            {author ? (
              <Link to={`/yazar/${author.id}`}>{author.name}</Link>
            ) : (
              "Bilinmeyen yazar"
            )}
            {book.year ? ` · ${book.year}` : ""}
            {book.pages ? ` · ${book.pages} sayfa` : ""}
          </p>
          {gercekAciklama(book.description) && (
            <p className="detail-desc">{gercekAciklama(book.description)}</p>
          )}

          <p className="detail-rating">
            <StarRating value={average} readOnly />
            <span className="detail-rating-count">
              ({count} değerlendirme)
            </span>
          </p>

          {isMember ? (
            <div className="recommend-box">
              <button
                className={iRecommend ? "btn-primary active" : "btn-primary"}
                onClick={() => toggleRecommend(book.id)}
                title={
                  iRecommend
                    ? "Öneriyi geri almak için tıkla"
                    : "Bu kitabı öner"
                }
              >
                {iRecommend ? "✓ Önerdin" : "👍 Bu kitabı öner"}
              </button>
              {iRecommend && (
                <span className="hint recommend-hint">
                  Kaldırmak için tekrar tıkla
                </span>
              )}
            </div>
          ) : null}

          <ShelfPicker bookId={book.id} />

          {recommenders.length > 0 && (
            <p className="recommenders">
              Önerenler:{" "}
              {recommenders.map((u, i) => (
                <span key={u!.id} className="recommender">
                  <Avatar user={u!} size={20} /> {u!.name}
                  {i < recommenders.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      {author && (
        <section className="author-box">
          <h2>Yazar hakkında</h2>
          <h3>
            <Link to={`/yazar/${author.id}`}>{author.name}</Link>
            {author.birthYear
              ? ` (${author.birthYear}–${author.deathYear ?? ""})`
              : ""}
          </h3>
          <p>{author.bio}</p>
        </section>
      )}

      <ReadingProgress bookId={book.id} />

      <Discussion bookId={book.id} />

      <section className="reviews-box">
        <h2>Değerlendirmeler</h2>
        {isMember && (
          <ReviewForm myReview={myReview} onSubmit={submit} onRemove={remove} />
        )}
        {/* Kendi yorumunu sadece formda düzenleyebiliyorsan listeden gizle.
            Form yoksa listede kalsın ki en azından görebilesin. */}
        <ReviewList
          reviews={reviews}
          hideUserId={isMember ? currentUser?.id : null}
          onDelete={removeById}
        />
      </section>

      <section className="quotes-box">
        <h2>Alıntılar</h2>
        <QuoteList
          quotes={quotes}
          onAdd={addQuote}
          onRemove={removeQuote}
          onToggleLike={toggleQuoteLike}
        />
      </section>

      {isAdmin && (
        <section className="admin-zone">
          {/* Sayfa sayısı Open Library'den tahminle geliyor ve Türkçe
              baskılarda sık sık yanlış oluyor — buradan düzeltilebilir. */}
          <span className="hint">Sayfa sayısı</span>
          <input
            className="admin-pages"
            type="number"
            min={1}
            defaultValue={book.pages ?? ""}
            key={book.pages ?? "bos"}
            onBlur={(e) => {
              const n = Math.round(Number(e.target.value));
              if (n > 0 && n !== book.pages) updateBook(book.id, { pages: n });
            }}
          />
          <span className="hint">
            Yanlış ya da mükerrer bir kayıtsa buradan silebilirsin.
          </span>
          <button
            className="btn-danger"
            onClick={async () => {
              const ok = window.confirm(
                `"${book.title}" kütüphaneden silinsin mi? Bu işlem geri alınamaz.`
              );
              if (!ok) return;
              await deleteBook(book.id);
              navigate("/kitaplar", { replace: true });
            }}
          >
            Kitabı sil
          </button>
        </section>
      )}
    </div>
  );
}
