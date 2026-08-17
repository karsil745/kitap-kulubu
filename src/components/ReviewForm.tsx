import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Review } from "../types";
import StarRating from "./StarRating";

// Giriş yapmış kullanıcının kendi puan/yorumunu ekleyip düzenlediği form.
// myReview varsa alanlar onunla dolu gelir (düzenleme modu).
export default function ReviewForm({
  myReview,
  onSubmit,
  onRemove,
}: {
  myReview: Review | null;
  onSubmit: (rating: number, text: string) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [text, setText] = useState(myReview?.text ?? "");
  const [saving, setSaving] = useState(false);
  // Hangi yorumu forma yükledik? Yorumlar Firestore'dan sonradan geldiği için
  // ilk render'da myReview null oluyor; useState'in başlangıç değeri bir daha
  // çalışmadığı için form boş kalıyordu ve kendi yorumun hiçbir yerde
  // görünmüyordu (listede de gösterilmiyor, çünkü burada düzenleniyor sayılıyor).
  const [loadedId, setLoadedId] = useState<string | null>(myReview?.id ?? null);
  // Firestore reddederse (izin/kural) kullanıcı sessiz bir başarısızlık yerine
  // sebebini görsün — önceden hata yutuluyor ve buton hiçbir şey yapmıyor gibi
  // görünüyordu.
  const [error, setError] = useState("");

  // Yorum geldiğinde (ya da başka bir kitaba geçildiğinde) formu onunla doldur.
  // Yazarken üzerine yazmasın diye sadece yorum kimliği değiştiğinde çalışır.
  useEffect(() => {
    if (myReview && myReview.id !== loadedId) {
      setRating(myReview.rating);
      setText(myReview.text ?? "");
      setLoadedId(myReview.id);
    } else if (!myReview && loadedId) {
      // Yorum silindi — formu temizle
      setRating(0);
      setText("");
      setLoadedId(null);
    }
  }, [myReview, loadedId]);

  function describe(e: unknown): string {
    const code = (e as { code?: string })?.code ?? "";
    if (code === "permission-denied") {
      return "Yetkin yok gibi görünüyor — kulüp üyeliğin onaylı mı? (users belgende approved: true)";
    }
    return "İşlem tamamlanamadı, tekrar dene.";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) return; // Puan seçilmeden gönderim yok
    setSaving(true);
    setError("");
    try {
      await onSubmit(rating, text.trim());
    } catch (err) {
      console.error("Yorum kaydedilemedi:", err);
      setError(describe(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    setError("");
    try {
      await onRemove();
      setRating(0);
      setText("");
    } catch (err) {
      console.error("Yorum silinemedi:", err);
      setError(describe(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <span className="review-form-label">
        {myReview ? "Senin yorumun" : "Sen ne düşünüyorsun?"}
      </span>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        placeholder="Bu kitap hakkında düşüncelerin (opsiyonel)"
        value={text}
        maxLength={2000}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="review-form-actions">
        <button className="btn-primary" type="submit" disabled={saving || rating === 0}>
          {myReview ? "Yorumu Güncelle" : "Yorum Ekle"}
        </button>
        {myReview && (
          <button
            className="btn-ghost"
            type="button"
            disabled={saving}
            onClick={handleRemove}
          >
            Sil
          </button>
        )}
      </div>
      {error && <p className="hint error">{error}</p>}
    </form>
  );
}
