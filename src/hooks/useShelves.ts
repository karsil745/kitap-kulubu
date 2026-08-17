import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Shelf, ShelfStatus } from "../types";

// Giriş yapan kullanıcının tüm raflarını (okudu/okuyor/okumak istiyor) gerçek
// zamanlı yönetir. Doc id'si deterministik: `${userId}__${bookId}` — böylece
// bir kullanıcı bir kitap için tek bir raf durumuna sahip olabilir.
export function useMyShelves() {
  const { currentUser, isMember } = useApp();
  const [shelves, setShelves] = useState<Shelf[]>([]);

  // Kendi raflarımı dinle.
  useEffect(() => {
    if (!currentUser) {
      setShelves([]);
      return;
    }
    const q = query(collection(db, "shelves"), where("userId", "==", currentUser.id));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setShelves(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shelf)));
      },
      (err) => console.error("Raflar dinlenemedi:", err)
    );
    return unsub;
  }, [currentUser]);

  // Bir kitabın rafını bulur.
  function statusOf(bookId: string): ShelfStatus | null {
    return shelves.find((s) => s.bookId === bookId)?.status ?? null;
  }

  // Bir kitaptaki okuma yüzdemi bulur (kayıt yoksa 0).
  function progressOf(bookId: string): number {
    return shelves.find((s) => s.bookId === bookId)?.progress ?? 0;
  }

  // Bir kitabın raf durumunu ayarlar. Aynı durum tekrar seçilirse raftan
  // kaldırır (deleteDoc); farklı bir durumsa yazar/günceller.
  // İlerleme durumla tutarlı tutulur: "okudum" 100, "okumak istiyorum" 0,
  // "okuyorum" ise varsa mevcut yüzdeyi korur.
  async function setStatus(bookId: string, status: ShelfStatus) {
    if (!currentUser || !isMember) return;
    const ref = doc(db, "shelves", `${currentUser.id}__${bookId}`);
    const current = statusOf(bookId);
    if (current === status) {
      await deleteDoc(ref);
      return;
    }
    const progress =
      status === "read" ? 100 : status === "want" ? 0 : progressOf(bookId);
    await setDoc(
      ref,
      {
        userId: currentUser.id,
        bookId,
        status,
        progress,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  // Okuma yüzdesini ayarlar. Kitap rafta değilse otomatik "okuyorum" olur;
  // %100'e çekilirse "okudum"a geçer — ayrıca durum seçmek gerekmesin.
  async function setProgress(bookId: string, percent: number) {
    if (!currentUser || !isMember) return;
    const pct = Math.min(100, Math.max(0, Math.round(percent)));
    await setDoc(
      doc(db, "shelves", `${currentUser.id}__${bookId}`),
      {
        userId: currentUser.id,
        bookId,
        status: pct >= 100 ? "read" : "reading",
        progress: pct,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  return { shelves, statusOf, progressOf, setStatus, setProgress };
}

// Bir kitabı raflarına eklemiş TÜM üyelerin kayıtları — "kim nerede okuyor"
// bölümü için. Raflar kurallarda giriş şartına bağlı olduğu için ziyaretçide
// dinleyiciyi hiç açmıyoruz (boşuna permission-denied basmasın).
export function useBookShelves(bookId: string) {
  const { currentUser } = useApp();
  const [shelves, setShelves] = useState<Shelf[]>([]);

  useEffect(() => {
    if (!currentUser || !bookId) {
      setShelves([]);
      return;
    }
    const q = query(collection(db, "shelves"), where("bookId", "==", bookId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setShelves(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shelf)));
      },
      (err) => console.error("Kitabın rafları dinlenemedi:", err)
    );
    return unsub;
  }, [bookId, currentUser]);

  return shelves;
}

// Tek bir kitap için pratik sarmalayıcı — ayrı bir listener açmadan,
// useMyShelves() üzerinden bu kitaba özel durumu döndürür.
export function useShelf(bookId: string) {
  const { shelves, setStatus, setProgress } = useMyShelves();

  const mine = useMemo(
    () => shelves.find((s) => s.bookId === bookId) ?? null,
    [shelves, bookId]
  );
  const status = mine?.status ?? null;
  const progress = mine?.progress ?? 0;

  return {
    status,
    progress,
    setStatus: (newStatus: ShelfStatus) => setStatus(bookId, newStatus),
    setProgress: (percent: number) => setProgress(bookId, percent),
  };
}
