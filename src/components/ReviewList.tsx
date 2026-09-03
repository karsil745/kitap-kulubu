import type { Review } from "../types";
import { useApp } from "../context/AppContext";
import StarRating from "./StarRating";
import Avatar from "./Avatar";

// Üyelerin yorumlarını listeler.
// `hideUserId`: kendi yorumu ReviewForm içinde düzenlenebiliyorsa burada tekrar
// gösterilmesin diye verilir. Form gösterilmiyorsa (onaysız üye) verilmez —
// yoksa kişinin kendi yorumu sayfada hiç görünmez ama ortalamayı etkilemeye
// devam eder.
export default function ReviewList({
  reviews,
  hideUserId,
  onDelete,
}: {
  reviews: Review[];
  hideUserId?: string | null;
  onDelete?: (reviewId: string) => Promise<void>;
}) {
  const { users, isAdmin } = useApp();

  const shown = hideUserId
    ? reviews.filter((r) => r.userId !== hideUserId)
    : reviews;

  if (shown.length === 0) {
    // Tek yorum seninse yukarıdaki formda duruyor — "hiç yorum yok" demek
    // yanıltıcı olur.
    return (
      <p className="empty">
        {reviews.length > 0 ? "Senin dışında henüz yorum yok." : "Henüz yorum yok."}
      </p>
    );
  }

  return (
    <div className="review-list">
      {shown.map((review) => {
        const author = users.find((u) => u.id === review.userId);
        return (
          <div className="review-card" key={review.id}>
            <div className="review-card-head">
              <span className="review-avatar">
                <Avatar user={author ?? { id: review.userId, photo: null }} size={22} />
              </span>
              <span className="review-name">
                {author?.name ?? "Bilinmeyen üye"}
              </span>
              <StarRating value={review.rating} readOnly />
              <span className="review-date">
                {new Date(review.createdAt).toLocaleDateString("tr-TR")}
              </span>
              {isAdmin && onDelete && (
                <button
                  className="btn-danger review-delete"
                  onClick={async () => {
                    const ok = window.confirm(
                      `${author?.name ?? "Bu üyenin"} yorumu silinsin mi?`
                    );
                    if (ok) await onDelete(review.id);
                  }}
                >
                  Sil
                </button>
              )}
            </div>
            {review.text && <p className="review-text">{review.text}</p>}
          </div>
        );
      })}
    </div>
  );
}
