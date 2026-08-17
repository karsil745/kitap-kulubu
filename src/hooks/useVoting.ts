import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Election, Vote } from "../types";

// Belirli bir ay için "Ayın Kitabı" oylamasını gerçek zamanlı yönetir.
// Oy belgesinin id'si deterministik: `${month}__${userId}` — böylece bir
// kullanıcı bir ay içinde en fazla bir oy kullanabilir; tekrar oylama günceller.
export function useVoting(month: string) {
  const { currentUser, isAdmin, isMember } = useApp();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [election, setElection] = useState<Election | null>(null);

  // Bu aya ait oyları dinle. Oy belgesinde kimin neye oy verdiği yazdığı için
  // kurallar okumayı giriş şartına bağlıyor — ziyaretçide dinleyiciyi hiç
  // açmıyoruz (boşuna "permission-denied" hatası basmasın).
  useEffect(() => {
    if (!currentUser) {
      setVotes([]);
      return;
    }
    const q = query(collection(db, "votes"), where("month", "==", month));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setVotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vote)));
      },
      (err) => console.error("Oylar dinlenemedi:", err)
    );
    return unsub;
  }, [month, currentUser]);

  // Bu ayın seçim (election) durumunu dinle.
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "elections", month),
      (snap) => {
        setElection(snap.exists() ? ({ id: snap.id, ...snap.data() } as Election) : null);
      },
      (err) => console.error("Seçim durumu dinlenemedi:", err)
    );
    return unsub;
  }, [month]);

  // Kitap başına oy sayısı, azalan sıralı.
  const tally = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of votes) {
      counts.set(v.bookId, (counts.get(v.bookId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([bookId, count]) => ({ bookId, count }))
      .sort((a, b) => b.count - a.count);
  }, [votes]);

  // Kendi oyladığım kitap.
  const myVote = useMemo(
    () => (currentUser ? votes.find((v) => v.userId === currentUser.id)?.bookId ?? null : null),
    [votes, currentUser]
  );

  // Şu an en çok oy alan kitap.
  const leaderId = tally[0]?.bookId ?? null;

  // Oylama açık mı? Seçim kaydı yoksa veya durumu "open" ise açık sayılır.
  const isOpen = !election || election.status === "open";

  // Kendi oyunu kullanır/günceller. Oylama kapalıysa veya giriş yoksa bir şey yapmaz.
  async function castVote(bookId: string) {
    if (!isOpen || !currentUser || !isMember) return;
    await setDoc(
      doc(db, "votes", `${month}__${currentUser.id}`),
      {
        month,
        userId: currentUser.id,
        bookId,
        createdAt: Date.now(),
      },
      { merge: true }
    );
  }

  // Oylamayı kesinleştirir: kazananı seçime ve takvime yazar. Sadece yönetici
  // çağırabilir. Kazanan belirtilmezse şu anki lider kullanılır; kazanan yoksa
  // (hiç oy yoksa) bir şey yapmaz.
  async function finalize(winnerBookId?: string) {
    if (!isAdmin || !currentUser) return;
    const winner = winnerBookId ?? leaderId;
    if (!winner) return;

    await setDoc(
      doc(db, "elections", month),
      {
        month,
        status: "closed",
        winnerBookId: winner,
        finalizedBy: currentUser.id,
        finalizedAt: Date.now(),
      },
      { merge: true }
    );
    await setDoc(
      doc(db, "schedule", month),
      {
        month,
        bookId: winner,
        setBy: currentUser.id,
        createdAt: Date.now(),
      },
      { merge: true }
    );
  }

  // Kesinleşmiş bir oylamayı yeniden açar (yanlış kesinleştirmeyi geri almak
  // için). Sadece yönetici çağırabilir; takvim kaydına dokunmaz.
  async function reopen() {
    if (!isAdmin) return;
    await setDoc(doc(db, "elections", month), { month, status: "open" }, { merge: true });
  }

  return { votes, election, tally, myVote, leaderId, isOpen, castVote, finalize, reopen };
}
