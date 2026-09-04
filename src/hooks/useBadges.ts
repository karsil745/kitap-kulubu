import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Badge, Review, Shelf, Vote } from "../types";

// UI'ın kazanılan/kilitli rozetleri ayırt edebilmesi için yerel tip.
export type EarnedBadge = Badge & { earned: boolean };

// Tüm rozet tanımları — yeni bir rozet eklemek için sadece bu diziye
// (ve altındaki kazanma koşuluna) eklemek yeterli. `icon`, badgeIcons.ts
// içindeki BADGE_ICON_PATHS'te bir anahtar (emoji değil, gerçek çizim).
const BADGE_DEFS: Badge[] = [
  { id: "first-rec", label: "İlk Öneri", icon: "book-plus", description: "En az 1 kitap önerdin." },
  { id: "loyal", label: "Sadık Okur", icon: "library", description: "En az 3 kitap önerdin." },
  { id: "finisher", label: "5 Kitap Bitirdi", icon: "award", description: "En az 5 kitabı 'okudum' rafına ekledin." },
  { id: "critic", label: "Eleştirmen", icon: "feather", description: "En az 3 yorum yazdın." },
  { id: "voter", label: "Oy Verdi", icon: "vote", description: "En az 1 oy kullandın." },
];

// Verilen kullanıcının rozetlerini mevcut veriden türetir — ayrı bir
// yazma/koleksiyon yoktur, sadece öneri/raf/yorum/oy sayıları hesaplanır.
export function useBadges(userId: string): EarnedBadge[] {
  const { books } = useApp();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);

  // Kullanıcının raflarını dinle (okunan sayısı için).
  useEffect(() => {
    if (!userId) {
      setShelves([]);
      return;
    }
    const q = query(collection(db, "shelves"), where("userId", "==", userId));
    const unsub = onSnapshot(
      q,
      (snap) => setShelves(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shelf))),
      (err) => console.error("Rozetler için raflar dinlenemedi:", err)
    );
    return unsub;
  }, [userId]);

  // Kullanıcının yorumlarını dinle.
  useEffect(() => {
    if (!userId) {
      setReviews([]);
      return;
    }
    const q = query(collection(db, "reviews"), where("userId", "==", userId));
    const unsub = onSnapshot(
      q,
      (snap) => setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))),
      (err) => console.error("Rozetler için yorumlar dinlenemedi:", err)
    );
    return unsub;
  }, [userId]);

  // Kullanıcının oylarını dinle (koleksiyon henüz boş olabilir, sorun değil).
  useEffect(() => {
    if (!userId) {
      setVotes([]);
      return;
    }
    const q = query(collection(db, "votes"), where("userId", "==", userId));
    const unsub = onSnapshot(
      q,
      (snap) => setVotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vote))),
      (err) => console.error("Rozetler için oylar dinlenemedi:", err)
    );
    return unsub;
  }, [userId]);

  const recCount = useMemo(
    () => books.filter((b) => b.recommendedBy.includes(userId)).length,
    [books, userId]
  );
  const readCount = useMemo(
    () => shelves.filter((s) => s.status === "read").length,
    [shelves]
  );
  const reviewCount = reviews.length;
  const voteCount = votes.length;

  return useMemo(() => {
    const earnedMap: Record<string, boolean> = {
      "first-rec": recCount >= 1,
      loyal: recCount >= 3,
      finisher: readCount >= 5,
      critic: reviewCount >= 3,
      voter: voteCount >= 1,
    };
    return BADGE_DEFS.map((def) => ({ ...def, earned: earnedMap[def.id] ?? false }));
  }, [recCount, readCount, reviewCount, voteCount]);
}
