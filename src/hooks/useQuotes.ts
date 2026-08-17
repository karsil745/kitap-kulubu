import { useEffect, useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Quote } from "../types";

// Bir kitabın tüm alıntılarını gerçek zamanlı yönetir.
// Yorumlardan farklı olarak bir kullanıcı birden çok alıntı ekleyebilir,
// bu yüzden doc id'si otomatik (auto-id) üretilir.
export function useQuotes(bookId: string) {
  const { currentUser, isMember } = useApp();
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // Bu kitaba ait alıntıları dinle — en yeni üstte olacak şekilde sırala.
  useEffect(() => {
    const q = query(collection(db, "quotes"), where("bookId", "==", bookId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Quote)
        );
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // En yeni üstte
        setQuotes(list);
      },
      (err) => console.error("Alıntılar dinlenemedi:", err)
    );
    return unsub;
  }, [bookId]);

  // Yeni bir alıntı ekler (giriş yapan kullanıcı adına).
  async function add(text: string, page?: string) {
    if (!currentUser || !isMember) return;
    // Uzunluk sınırları kurallarda da var — dev belgelerle kota şişirilmesin.
    const clean = text.trim().slice(0, 2000);
    if (!clean) return;
    await addDoc(collection(db, "quotes"), {
      bookId,
      userId: currentUser.id,
      text: clean,
      page: page ? page.slice(0, 20) : null,
      createdAt: Date.now(),
      likedBy: [],
    });
  }

  // "Ben de": kendini alıntının işaretleyenler listesine ekler/çıkarır.
  // Kural da yalnızca bu alana ve yalnızca kendi kimliğine izin veriyor.
  async function toggleLike(quoteId: string) {
    if (!currentUser || !isMember) return;
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    const iLiked = (quote.likedBy ?? []).includes(currentUser.id);
    await updateDoc(doc(db, "quotes", quoteId), {
      likedBy: iLiked ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id),
    });
  }

  // Bir alıntıyı siler (yalnızca kendi alıntın için çağrılmalı — kural da bunu zorlar).
  async function remove(id: string) {
    await deleteDoc(doc(db, "quotes", id));
  }

  return { quotes, add, remove, toggleLike };
}
