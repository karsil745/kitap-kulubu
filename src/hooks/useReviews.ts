import { useMemo } from "react";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";

// Bir kitabın tüm puan/yorumlarını gerçek zamanlı yönetir.
// Doc id'si deterministik: `${bookId}__${userId}` — böylece bir kullanıcı
// bir kitaba en fazla bir yorum yazabilir; tekrar gönderim güncelleme olur.
export function useReviews(bookId: string) {
  const { currentUser, isMember, isAdmin, reviews: tumYorumlar } = useApp();

  // Bu kitaba ait yorumlar — AppContext tüm koleksiyonu zaten dinliyor,
  // burada ikinci bir onSnapshot açmak yerine süzülüyor. En yeni üstte.
  const reviews = useMemo(
    () =>
      tumYorumlar
        .filter((r) => r.bookId === bookId)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [tumYorumlar, bookId]
  );

  const myReview = useMemo(
    () =>
      currentUser
        ? reviews.find((r) => r.userId === currentUser.id) ?? null
        : null,
    [reviews, currentUser]
  );

  const count = reviews.length;
  const average = useMemo(() => {
    if (count === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / count) * 10) / 10; // Bir ondalık basamak
  }, [reviews, count]);

  // Kendi puan/yorumunu ekler veya günceller.
  async function submit(rating: number, text: string) {
    if (!currentUser || !isMember) return;
    // Kurallar da aynısını zorlar: puan 1–5 arası tam sayı, yorum en fazla
    // 2000 karakter. Bozuk veri ortalamayı ve listeyi bozmasın.
    const safeRating = Math.min(5, Math.max(1, Math.round(rating)));
    const ref = doc(db, "reviews", `${bookId}__${currentUser.id}`);
    await setDoc(
      ref,
      {
        bookId,
        userId: currentUser.id,
        rating: safeRating,
        text: text.slice(0, 2000),
        createdAt: myReview?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  // Kendi yorumunu siler.
  async function remove() {
    if (!currentUser) return;
    await deleteDoc(doc(db, "reviews", `${bookId}__${currentUser.id}`));
  }

  // Yönetici herhangi bir yorumu siler (moderasyon). Kurallar da isAdmin() arar.
  async function removeById(reviewId: string) {
    if (!isAdmin) return;
    await deleteDoc(doc(db, "reviews", reviewId));
  }

  return { reviews, myReview, average, count, submit, remove, removeById };
}
