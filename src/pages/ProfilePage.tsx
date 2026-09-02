import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import { useMyShelves } from "../hooks/useShelves";
import { usePageTitle } from "../hooks/usePageTitle";
import BookCard from "../components/BookCard";
import BadgeList from "../components/BadgeList";
import ReadingGoal from "../components/ReadingGoal";
import StarRating from "../components/StarRating";
import Avatar from "../components/Avatar";
import MemberApprovals from "../components/MemberApprovals";
import type { Review } from "../types";

// Profil sayfasında seçilebilecek emoji avatarlar.
const AVATAR_OPTIONS = [
  "🦉", "🐺", "🦊", "🐧", "🦋", "🐢", "🦁", "🐨", "🦄", "🐙", "📚", "☕", "🌙", "🦇",
];

// Kullanıcının kendi profili: bilgileri + rafları + rozetleri + önerdiği
// kitaplar + verdiği yorumlar.
export default function ProfilePage() {
  const { currentUser, books, updateAvatar } = useApp();
  const { statusOf } = useMyShelves();
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  usePageTitle("Profilim");

  // Kendi yorumlarımı dinle. useReviews kitap bazlı çalıştığı için burada
  // ayrı, basit bir onSnapshot ile kullanıcı bazlı sorgu yapıyoruz.
  useEffect(() => {
    if (!currentUser) {
      setMyReviews([]);
      return;
    }
    const q = query(collection(db, "reviews"), where("userId", "==", currentUser.id));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // En yeni üstte
        setMyReviews(list);
      },
      (err) => console.error("Yorumlarım dinlenemedi:", err)
    );
    return unsub;
  }, [currentUser]);

  // Giriş yapılmadıysa giriş sayfasına yönlendir
  if (!currentUser) return <Navigate to="/giris" replace />;

  const myBooks = books.filter((b) =>
    b.recommendedBy.includes(currentUser.id)
  );

  // Raf durumuna göre kitapları grupla.
  const readBooks = books.filter((b) => statusOf(b.id) === "read");
  const readingBooks = books.filter((b) => statusOf(b.id) === "reading");
  const wantBooks = books.filter((b) => statusOf(b.id) === "want");

  return (
    <div className="section">
      <div className="profile-head">
        <div className="profile-avatar">
          <Avatar user={currentUser} size={90} />
        </div>
        <div>
          <h1>{currentUser.name}</h1>
          <p className="hint">{currentUser.bio}</p>
          <p className="book-recs">{myBooks.length} kitap önerdin</p>
        </div>
      </div>

      <ReadingGoal />

      {/* Yönetici değilsen bu bölüm hiç render edilmez */}
      <MemberApprovals />

      <div className="section-head">
        <h2>Avatarım</h2>
      </div>
      <div className="avatar-picker">
        {AVATAR_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            className={
              !currentUser.photo && currentUser.avatar === emoji
                ? "chip avatar-option active"
                : "chip avatar-option"
            }
            onClick={() => updateAvatar({ avatar: emoji })}
          >
            {emoji}
          </button>
        ))}
        {auth.currentUser?.photoURL && (
          <button
            className={
              currentUser.photo
                ? "chip avatar-option-photo active"
                : "chip avatar-option-photo"
            }
            onClick={() =>
              updateAvatar({ photo: auth.currentUser?.photoURL ?? null })
            }
          >
            Google fotoğrafımı kullan
          </button>
        )}
      </div>

      <div className="section-head">
        <h2>Rozetlerim</h2>
      </div>
      <BadgeList userId={currentUser.id} />

      <div className="section-head">
        <h2>Okuduklarım</h2>
      </div>
      {readBooks.length === 0 ? (
        <p className="empty">Henüz okuduğun bir kitap işaretlemedin.</p>
      ) : (
        <div className="book-grid">
          {readBooks.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>Şu an okuduklarım</h2>
      </div>
      {readingBooks.length === 0 ? (
        <p className="empty">Şu an okuduğun bir kitap yok.</p>
      ) : (
        <div className="book-grid">
          {readingBooks.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>Okumak istediklerim</h2>
      </div>
      {wantBooks.length === 0 ? (
        <p className="empty">Okuma listende henüz kitap yok.</p>
      ) : (
        <div className="book-grid">
          {wantBooks.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>Önerdiğim kitaplar</h2>
        <Link to="/kitaplar" className="link-more">
          + Yeni öner
        </Link>
      </div>

      {myBooks.length === 0 ? (
        <p className="empty">
          Henüz kitap önermedin.{" "}
          <Link to="/kitaplar">Hemen bir tane öner →</Link>
        </p>
      ) : (
        <div className="book-grid">
          {myBooks.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>Verdiğim yorumlar</h2>
      </div>
      {myReviews.length === 0 ? (
        <p className="empty">Henüz yorum yazmadın.</p>
      ) : (
        // `kart`: kitap detayındaki aynı liste zaten bir kartın içinde olduğu
        // için kart yüzeyi yalnızca burada isteniyor (iç içe kart olmasın).
        <div className="review-list kart">
          {myReviews.map((review) => {
            const book = books.find((b) => b.id === review.bookId);
            return (
              <div className="review-card" key={review.id}>
                <div className="review-card-head">
                  <span className="review-name">
                    {book ? (
                      <Link to={`/kitap/${book.id}`}>{book.title}</Link>
                    ) : (
                      "Bilinmeyen kitap"
                    )}
                  </span>
                  <StarRating value={review.rating} readOnly />
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                {review.text && <p className="review-text">{review.text}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
