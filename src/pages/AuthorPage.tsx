import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import BookCard from "../components/BookCard";

// Tek bir yazarın detay sayfası: tanıtım bilgileri ve o yazara ait kitaplar.
export default function AuthorPage() {
  const { id } = useParams();
  const { authors, books } = useApp();

  const author = authors.find((a) => a.id === id);
  usePageTitle(author?.name);

  if (!author) {
    return (
      <div className="section">
        <p className="empty">Yazar bulunamadı.</p>
        <Link to="/kitaplar" className="link-more">
          ← Kitaplara dön
        </Link>
      </div>
    );
  }

  const authorBooks = books.filter((b) => b.authorId === author.id);

  // Aynı dönem/akımdan diğer yazarlar — kütüphanede zaten varlar, sadece
  // era etiketiyle eşleştirip bağlantısını çıkarıyoruz. Yeni veri yok.
  const sameEraAuthors = author.era
    ? authors.filter((a) => a.id !== author.id && a.era === author.era)
    : [];

  return (
    <div className="section detail">
      <Link to="/kitaplar" className="link-more">
        ← Kitaplara dön
      </Link>

      <section className="author-box">
        {author.era && <span className="era-tag">{author.era}</span>}
        <h1>
          {author.name}
          {author.birthYear
            ? ` (${author.birthYear}–${author.deathYear ?? ""})`
            : ""}
        </h1>
        <p>{author.bio?.trim() ? author.bio : "Henüz tanıtım eklenmedi."}</p>
      </section>

      <div className="section-head">
        <h2>Kitapları</h2>
      </div>

      {authorBooks.length === 0 ? (
        <p className="empty">Bu yazara ait kitap henüz eklenmedi.</p>
      ) : (
        <div className="book-grid">
          {authorBooks.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}

      {/* Veri yoksa hiç render edilmez — boş "ilgili yazar yok" metni yazmıyoruz. */}
      {sameEraAuthors.length > 0 && (
        <p className="author-related">
          Aynı dönemden diğer yazarlar:{" "}
          {sameEraAuthors.map((a, i) => (
            <span key={a.id}>
              <Link to={`/yazar/${a.id}`}>{a.name}</Link>
              {i < sameEraAuthors.length - 1 && ", "}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
