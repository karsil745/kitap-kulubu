import { useState } from "react";
import type { Book } from "../types";

// Kitap kapağını gösterir.
// Gerçek kapak resmi varsa onu, yüklenemezse (veya yoksa) emoji'yi gösterir.
export default function Cover({
  book,
  className,
}: {
  book: Book;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = book.coverImage && !failed;

  return showImage ? (
    <img
      className={className}
      src={book.coverImage}
      alt={book.title}
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={className}>{book.cover}</span>
  );
}
