import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Review } from "../types";

// Bir kitabın tüm puan/yorumlarını gerçek zamanlı yönetir.
// Doc id'si deterministik: `${bookId}__${userId}` — böylece bir kullanıcı
// bir kitaba en fazla bir yorum yazabilir; tekrar gönderim güncelleme olur.
export function useReviews(bookId: string) {
  const { currentUser, isMember, isAdmin } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);

  // Bu kitaba ait yorumları dinle — en yeni üstte olacak şekilde sırala.
  useEffect(() => {
    const q = query(collection(db, "reviews"), where("bookId", "==", bookId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Review)
        );
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // En yeni üstte
        setReviews(list);
      },
      (err) => console.error("Yorumlar dinlenemedi:", err)
    );
    return unsub;
  }, [bookId]);

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
