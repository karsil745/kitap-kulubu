import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import { useMyShelves } from "../hooks/useShelves";
import { usePageTitle } from "../hooks/usePageTitle";
import BookCard from "../components/BookCard";
import BadgeList from "../components/BadgeList";
import ReadingGoal from "../components/ReadingGoal";
import StarRating from "../components/StarRating";
import Avatar from "../components/Avatar";
import MemberApprovals from "../components/MemberApprovals";

// Kullanıcının kendi profili: bilgileri + rafları + rozetleri + önerdiği
// kitaplar + verdiği yorumlar.
const BIO_SINIRI = 500; // firestore.rules: shortText(bio, 500)

export default function ProfilePage() {
  const { currentUser, books, reviews, updateAvatar, setBio } = useApp();
  const { shelves, statusOf } = useMyShelves();
  usePageTitle("Profilim");

  // Biyografi düzenleme: taslak yalnızca düzenleme moduna girerken
  // currentUser.bio'dan dolduruluyor, sonra kendi başına yaşıyor — yoksa
  // her karakterde currentUser güncellenip taslağın üzerine yazardı.
  const [bioDuzenleniyor, setBioDuzenleniyor] = useState(false);
  const [bioTaslak, setBioTaslak] = useState("");
  const [bioKaydediliyor, setBioKaydediliyor] = useState(false);
  const [bioHata, setBioHata] = useState("");

  function bioDuzenlemeyeBasla() {
    setBioTaslak(currentUser?.bio ?? "");
    setBioHata("");
    setBioDuzenleniyor(true);
  }

  function bioVazgec() {
    setBioDuzenleniyor(false);
    setBioHata("");
  }

  async function bioKaydet() {
    setBioKaydediliyor(true);
    setBioHata("");
    try {
      await setBio(bioTaslak.trim());
      setBioDuzenleniyor(false);
    } catch (err) {
      // Hata olduğunda form AÇIK kalır, yazdığı metin kaybolmaz — projenin
      // yerleşik deseni (bkz. QuoteList, ReviewForm, ReadingGoal).
      console.error("Biyografi kaydedilemedi:", err);
      setBioHata("Biyografi kaydedilemedi, tekrar dene.");
    } finally {
      setBioKaydediliyor(false);
    }
  }

  // Giriş yapılmadıysa giriş sayfasına yönlendir
  if (!currentUser)
    return <Navigate to="/giris" state={{ from: "/profil" }} replace />;

  // Kendi yorumlarım — AppContext tüm yorumları zaten dinliyor, burada
  // yalnızca süzülüyor. En yeni üstte.
  const myReviews = reviews
    .filter((r) => r.userId === currentUser.id)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  const myBooks = books.filter((b) =>
    b.recommendedBy.includes(currentUser.id)
  );
  const favoriteBooks = books.filter((b) =>
    (b.favoritedBy ?? []).includes(currentUser.id)
  );

  // Raf durumuna göre kitapları grupla.
  const readBooks = books.filter((b) => statusOf(b.id) === "read");
  const readingBooks = books.filter((b) => statusOf(b.id) === "reading");
  const wantBooks = books.filter((b) => statusOf(b.id) === "want");

  return (
    // `profil` sınıfı yalnızca kapsam içindir: bu sayfanın görsel kuralları
    // (.section-head, .empty, .chip, .reading-goal …) sitenin geri kalanında
    // da kullanılan sınıflara dokunuyor, hepsi bu kapsamın altında kalıyor.
    <div className="section profil">
      <div className="profile-head">
        <div className="profile-avatar">
          <Avatar user={currentUser} size={90} />
        </div>
        <div className="profile-kunye">
          <h1>{currentUser.name}</h1>

          {bioDuzenleniyor ? (
            <div className="bio-form">
              <textarea
                value={bioTaslak}
                maxLength={BIO_SINIRI}
                placeholder="Kendini birkaç cümleyle tanıt"
                aria-label="Biyografi"
                autoFocus
                onChange={(e) => setBioTaslak(e.target.value)}
              />
              <div className="bio-form-foot">
                {/* Sınır kuraldakiyle (500) aynı — burada aşılamaz zaten,
                    ama kaç karakter kaldığını görmek yazarken rahatlatır. */}
                <span className="hint bio-sayac">
                  {bioTaslak.length} / {BIO_SINIRI}
                </span>
                <div className="bio-form-actions">
                  <button
                    className="btn-ghost"
                    type="button"
                    disabled={bioKaydediliyor}
                    onClick={bioVazgec}
                  >
                    Vazgeç
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    disabled={bioKaydediliyor}
                    onClick={bioKaydet}
                  >
                    {bioKaydediliyor ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                </div>
              </div>
              {bioHata && <p className="hint error">{bioHata}</p>}
            </div>
          ) : (
            <>
              {/* Boş biyografide "henüz yok" demeden önce doldurma daveti —
                  bu satır kişisel bir alan, sitenin genel "boş durumu hiç
                  gösterme" kuralı burada geçerli değil: kullanıcı burada her
                  zaman kendi profilini görüyor, davet anlamsız değil. */}
              <p className="hint">
                {currentUser.bio || "Henüz bir tanıtım yazmadın."}
              </p>
              <button
                className="btn-ghost bio-duzenle-btn"
                type="button"
                onClick={bioDuzenlemeyeBasla}
              >
                Profili düzenle
              </button>
            </>
          )}

          <p className="book-recs">{myBooks.length} kitap önerdin</p>
        </div>
      </div>

      <ReadingGoal shelves={shelves} />

      {/* Yönetici değilsen bu bölüm hiç render edilmez */}
      <MemberApprovals />

      <div className="section-head">
        <h2>Avatarım</h2>
      </div>
      <div className="avatar-picker">
        <Link to="/profil/figur" className="btn-primary">
          Profili özelleştir
        </Link>
        {auth.currentUser?.photoURL && (
          <button
            className={currentUser.photo ? "chip active" : "chip"}
            aria-pressed={!!currentUser.photo}
            onClick={() =>
              updateAvatar(currentUser.photo ? null : auth.currentUser?.photoURL ?? null)
            }
          >
            {currentUser.photo
              ? "Google fotoğrafını kaldır"
              : "Google fotoğrafımı kullan"}
          </button>
        )}
      </div>

      <div className="section-head">
        <h2>Rozetlerim</h2>
      </div>
      <BadgeList userId={currentUser.id} />

      <div className="section-head">
        <h2>Favori kitaplarım</h2>
      </div>
      {favoriteBooks.length === 0 ? (
        <p className="empty">
          Henüz favori işaretlemedin. Bir kitabın sayfasında ☆ Favorilerime
          ekle'ye bas.
        </p>
      ) : (
        <div className="book-grid">
          {favoriteBooks.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}

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
