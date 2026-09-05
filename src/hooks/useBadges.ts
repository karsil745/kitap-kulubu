import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import { ERAS } from "../data/mockData";
import type { Answer, Badge, Katilim, Quote, Review, Shelf, Vote } from "../types";

// UI'ın kazanılan/kilitli rozetleri ayırt edebilmesi için yerel tip.
export type EarnedBadge = Badge & { earned: boolean };

// Tüm rozet tanımları — yeni bir rozet eklemek için sadece bu diziye
// (ve altındaki kazanma koşuluna) eklemek yeterli. `icon`, badgeIcons.ts
// içindeki BADGE_ICON_PATHS'te bir anahtar (emoji değil, gerçek çizim).
const BADGE_DEFS: Badge[] = [
  { id: "first-rec", label: "İlk Öneri", icon: "book-plus", description: "En az 1 kitap önerdin." },
  { id: "loyal", label: "Sadık Okur", icon: "library", description: "En az 3 kitap önerdin." },
  { id: "finisher-5", label: "5 Kitap Bitirdi", icon: "award", description: "En az 5 kitabı 'okudum' rafına ekledin." },
  { id: "finisher-10", label: "10 Kitap Bitirdi", icon: "award", description: "En az 10 kitabı 'okudum' rafına ekledin." },
  { id: "finisher-25", label: "25 Kitap Bitirdi", icon: "award", description: "En az 25 kitabı 'okudum' rafına ekledin." },
  { id: "critic", label: "Eleştirmen", icon: "feather", description: "En az 3 yorum yazdın." },
  { id: "voter", label: "Oy Verdi", icon: "vote", description: "En az 1 oy kullandın." },
  { id: "quote-hunter", label: "Alıntı Avcısı", icon: "quote", description: "En az 3 alıntı ekledin." },
  { id: "popular-quote", label: "Popüler Alıntı", icon: "heart", description: "Bir alıntın en az 3 kişi tarafından beğenildi." },
  { id: "pages-1000", label: "1000 Sayfa Kulübü", icon: "scroll-text", description: "Bitirdiğin kitapların toplam sayfası 1000'i geçti." },
  { id: "era-explorer", label: "Her Dönemden", icon: "compass", description: "Kütüphanedeki her dönemden en az bir kitap okudun." },
  { id: "attendance-streak", label: "Toplantı Kaçırmaz", icon: "calendar-check", description: "Üst üste en az 3 ay 'geliyorum' dedin." },
  { id: "discussion", label: "Tartışmacı", icon: "message-square-text", description: "En az 3 tartışma sorusuna cevap yazdın." },
  { id: "goal-achiever", label: "Hedefini Tuttu", icon: "target", description: "Bu yılki okuma hedefini gerçekleştirdin." },
];

// "YYYY-MM" iki ayın art arda gelip gelmediğini söyler (yerel takvim, bkz. lib/month.ts).
function isNextMonth(prev: string, next: string): boolean {
  const [py, pm] = prev.split("-").map(Number);
  const [ny, nm] = next.split("-").map(Number);
  const prevIdx = py * 12 + (pm - 1);
  const nextIdx = ny * 12 + (nm - 1);
  return nextIdx === prevIdx + 1;
}

// Verilen kullanıcının rozetlerini mevcut veriden türetir — ayrı bir
// yazma/koleksiyon yoktur, sadece öneri/raf/yorum/oy/alıntı/katılım/cevap
// sayıları hesaplanır.
export function useBadges(userId: string): EarnedBadge[] {
  const { books, users } = useApp();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [katilim, setKatilim] = useState<Katilim[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Kullanıcının raflarını dinle (okunan sayısı, sayfa toplamı, dönem çeşitliliği için).
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

  // Kullanıcının alıntılarını dinle — herkese açık, giriş şartı yok.
  useEffect(() => {
    if (!userId) {
      setQuotes([]);
      return;
    }
    const q = query(collection(db, "quotes"), where("userId", "==", userId));
    const unsub = onSnapshot(
      q,
      (snap) => setQuotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote))),
      (err) => console.error("Rozetler için alıntılar dinlenemedi:", err)
    );
    return unsub;
  }, [userId]);

  // Kullanıcının katılım kayıtlarını dinle.
  useEffect(() => {
    if (!userId) {
      setKatilim([]);
      return;
    }
    const q = query(collection(db, "katilim"), where("userId", "==", userId));
    const unsub = onSnapshot(
      q,
      (snap) => setKatilim(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Katilim))),
      (err) => console.error("Rozetler için katılım dinlenemedi:", err)
    );
    return unsub;
  }, [userId]);

  // Kullanıcının tartışma cevaplarını dinle.
  useEffect(() => {
    if (!userId) {
      setAnswers([]);
      return;
    }
    const q = query(collection(db, "answers"), where("userId", "==", userId));
    const unsub = onSnapshot(
      q,
      (snap) => setAnswers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Answer))),
      (err) => console.error("Rozetler için cevaplar dinlenemedi:", err)
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
  const quoteCount = quotes.length;
  const popularQuote = useMemo(
    () => quotes.some((q) => (q.likedBy?.length ?? 0) >= 3),
    [quotes]
  );
  const discussionCount = answers.length;

  // Bitirdiği kitapların toplam sayfası.
  const pagesRead = useMemo(() => {
    const readIds = new Set(
      shelves.filter((s) => s.status === "read").map((s) => s.bookId)
    );
    return books
      .filter((b) => readIds.has(b.id))
      .reduce((sum, b) => sum + (b.pages ?? 0), 0);
  }, [shelves, books]);

  // Kütüphanedeki her dönemden en az bir kitap okumuş mu?
  const erasCovered = useMemo(() => {
    const readIds = new Set(
      shelves.filter((s) => s.status === "read").map((s) => s.bookId)
    );
    const erasRead = new Set(
      books.filter((b) => readIds.has(b.id)).map((b) => b.era)
    );
    return ERAS.every((era) => erasRead.has(era));
  }, [shelves, books]);

  // "Geliyorum" dediği en uzun art arda ay dizisi.
  const attendanceStreak = useMemo(() => {
    const months = katilim
      .filter((k) => k.durum === "geliyor")
      .map((k) => k.month)
      .sort();
    let best = 0;
    let current = 0;
    let prevMonth: string | null = null;
    for (const m of months) {
      current = prevMonth && isNextMonth(prevMonth, m) ? current + 1 : 1;
      best = Math.max(best, current);
      prevMonth = m;
    }
    return best;
  }, [katilim]);

  // Bu yılki okuma hedefini tuttu mu? Hedef users listesindeki kendi profilinde.
  const readingGoalAchieved = useMemo(() => {
    const me = users.find((u) => u.id === userId);
    if (!me?.readingGoal) return false;
    const yil = new Date().getFullYear();
    const okunan = shelves.filter(
      (s) => s.status === "read" && new Date(s.updatedAt).getFullYear() === yil
    ).length;
    return okunan >= me.readingGoal;
  }, [users, userId, shelves]);

  return useMemo(() => {
    const earnedMap: Record<string, boolean> = {
      "first-rec": recCount >= 1,
      loyal: recCount >= 3,
      "finisher-5": readCount >= 5,
      "finisher-10": readCount >= 10,
      "finisher-25": readCount >= 25,
      critic: reviewCount >= 3,
      voter: voteCount >= 1,
      "quote-hunter": quoteCount >= 3,
      "popular-quote": popularQuote,
      "pages-1000": pagesRead >= 1000,
      "era-explorer": erasCovered,
      "attendance-streak": attendanceStreak >= 3,
      discussion: discussionCount >= 3,
      "goal-achiever": readingGoalAchieved,
    };
    return BADGE_DEFS.map((def) => ({ ...def, earned: earnedMap[def.id] ?? false }));
  }, [
    recCount,
    readCount,
    reviewCount,
    voteCount,
    quoteCount,
    popularQuote,
    pagesRead,
    erasCovered,
    attendanceStreak,
    discussionCount,
    readingGoalAchieved,
  ]);
}
