import { Link } from "react-router-dom";
import { useQuoteOfTheDay } from "../hooks/useQuoteOfTheDay";
import Avatar from "./Avatar";

// Ana sayfanın en üstünde gösterilen "Günün Sözü" şeridi.
// Üyelerin eklediği alıntılardan her gün deterministik biçimde biri seçilir;
// hiç alıntı yoksa okuma temalı bir yedek söz gösterilir.
export default function QuoteOfTheDay() {
  const { text, source, user, isFallback } = useQuoteOfTheDay();

  return (
    <section className="quote-of-day">
      <span className="quote-of-day-label">Günün Sözü</span>
      <p className="quote-of-day-text">“{text}”</p>
      {!isFallback && source ? (
        <p className="quote-of-day-attribution">
          <Link to={`/kitap/${source.bookId}`} className="quote-of-day-book">
            {source.bookTitle}
          </Link>
          {source.authorName && (
            <span className="quote-of-day-author"> — {source.authorName}</span>
          )}
          {user && (
            <span className="quote-of-day-user">
              , ekleyen: <Avatar user={user} size={20} /> {user.name}
            </span>
          )}
        </p>
      ) : (
        <p className="quote-of-day-attribution quote-of-day-attribution-fallback">
          — Bibliyofili
        </p>
      )}
    </section>
  );
}
