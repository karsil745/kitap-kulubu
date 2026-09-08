import { useState } from "react";
import type { FormEvent } from "react";
import type { Quote } from "../types";
import { useApp } from "../context/AppContext";
import Avatar from "./Avatar";

// Bir kitabın alıntılarını listeler ve (giriş yapılmışsa) yeni alıntı
// eklemeye yarayan küçük formu gösterir.
export default function QuoteList({
  quotes,
  onAdd,
  onRemove,
  onToggleLike,
}: {
  quotes: Quote[];
  onAdd: (text: string, page?: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onToggleLike: (id: string) => Promise<void>;
}) {
  const { users, currentUser, isMember } = useApp();
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  const [saving, setSaving] = useState(false);
  // Hata yakalanmadığında kullanıcı hiçbir şey görmüyor, üstelik metin kutusu
  // temizlendiği için yazdığı alıntı kayboluyordu. Alanlar ancak yazma
  // GERÇEKTEN başarılı olunca temizlenir.
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return; // Boş metinle eklenmesin
    setSaving(true);
    setError("");
    try {
      await onAdd(text.trim(), page.trim());
      setText("");
      setPage("");
    } catch (err) {
      console.error("Alıntı eklenemedi:", err);
      setError("Alıntı eklenemedi, tekrar dene. Yazdığın metin duruyor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {isMember ? (
        <form className="quote-form" onSubmit={handleSubmit}>
          <textarea
            placeholder="Sevdiğin bir alıntıyı paylaş"
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="quote-form-row">
            <input
              placeholder="Sayfa (isteğe bağlı)"
              value={page}
              maxLength={20}
              onChange={(e) => setPage(e.target.value)}
            />
            <button
              className="btn-primary"
              type="submit"
              disabled={saving || !text.trim()}
            >
              Alıntı Ekle
            </button>
          </div>
          {error && <p className="hint error">{error}</p>}
        </form>
      ) : (
        <p className="hint">
          {currentUser
            ? "Alıntı ekleyebilmek için üyeliğinin onaylanması gerekiyor."
            : "Alıntı eklemek için giriş yap."}
        </p>
      )}

      {quotes.length === 0 ? (
        <p className="empty">Henüz alıntı yok. İlk alıntıyı sen ekle.</p>
      ) : (
        <div className="quote-list">
          {quotes.map((quote) => {
            const author = users.find((u) => u.id === quote.userId);
            const mine = currentUser?.id === quote.userId;

            // "Ben de" diyenler. Alıntıyı ekleyen kişi listede sayılmaz —
            // zaten o çizmiş, kendini işaretlemesi anlamsız.
            const likers = (quote.likedBy ?? []).filter(
              (uid) => uid !== quote.userId
            );
            const iLiked = currentUser ? likers.includes(currentUser.id) : false;
            const likerNames = likers
              .map((uid) =>
                uid === currentUser?.id
                  ? "sen"
                  : users.find((u) => u.id === uid)?.name ?? "bir üye"
              )
              .join(", ");

            return (
              <div className="quote-card" key={quote.id}>
                <p className="quote-text">{quote.text}</p>
                <div className="quote-card-foot">
                  <span className="quote-author">
                    <Avatar user={author ?? { id: quote.userId, photo: null }} size={20} />
                    {author?.name ?? "Bilinmeyen üye"}
                  </span>
                  {quote.page && <span className="quote-page">s. {quote.page}</span>}
                  <span className="quote-date">
                    {new Date(quote.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                  {mine && (
                    <button
                      type="button"
                      className="btn-ghost quote-remove"
                      onClick={() => onRemove(quote.id)}
                    >
                      Sil
                    </button>
                  )}
                </div>

                {(likers.length > 0 || (isMember && !mine)) && (
                  <div className="quote-echo">
                    {likers.length > 0 && (
                      <span className="quote-echo-who">
                        {likerNames} de işaretledi
                      </span>
                    )}
                    {isMember && !mine && (
                      <button
                        type="button"
                        className={iLiked ? "quote-echo-btn on" : "quote-echo-btn"}
                        onClick={() => onToggleLike(quote.id)}
                      >
                        {iLiked ? "✓ Ben de" : "Ben de"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
