import { Link } from "react-router-dom";
import type { Book } from "../types";
import { useApp } from "../context/AppContext";
import Cover from "./Cover";
import StarRating from "./StarRating";

// Tek bir kitabı özet halinde gösteren kart (kutusuz):
// kapak + ad + üyelerin verdiği ortalama yıldız puanı.
// `index` verilirse kapağın üstünde dergi listelerindeki gibi sıra numarası çıkar.
export default function BookCard({
  book,
  index,
  puan,
}: {
  book: Book;
  index?: number;
  // Katalog ortalamaları zaten hesaplıyor ve buradan veriyor; puanı olmayan
  // kitap için null gelir. Prop hiç verilmezse (profil, yazar sayfası) puan
  // aşağıda yorum listesinden hesaplanır.
  puan?: { ortalama: number; adet: number } | null;
}) {
  const { authors, reviews } = useApp();
  const author = authors.find((a) => a.id === book.authorId);

  let count: number;
  let average: number;
  if (puan !== undefined) {
    // Hazır değer geldi (null = puan yok): yorum listesi hiç taranmaz.
    count = puan?.adet ?? 0;
    average = puan?.ortalama ?? 0;
  } else {
    const bookReviews = reviews.filter((r) => r.bookId === book.id);
    count = bookReviews.length;
    average =
      count > 0
        ? bookReviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;
  }

  return (
    <Link to={`/kitap/${book.id}`} className="book-card">
      {index !== undefined && (
        <span className="book-index">{String(index).padStart(2, "0")}</span>
      )}
      <div className="book-cover">
        <Cover book={book} className="cover-emoji" />
      </div>
      <div className="book-info">
        <h3>{book.title}</h3>
        <p className="book-author">{author?.name ?? "Bilinmeyen yazar"}</p>
        {/* Kısa künye: yıl ve sayfa sayısı. İkisi de yoksa satır hiç çıkmaz. */}
        {(book.year || book.pages) && (
          <p className="book-meta">
            {[book.year, book.pages && `${book.pages} sayfa`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {/* Puanı olmayan kitapta hiç satır çıkarmıyoruz — boş durum metni
            ızgarada gereksiz gürültü yapıyordu. */}
        {count > 0 && (
          <p className="book-rating">
            <StarRating value={average} readOnly />
            <span className="book-rating-num">
              {average.toFixed(1)} · {count}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
