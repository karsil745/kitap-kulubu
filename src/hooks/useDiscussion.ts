import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Answer, Question } from "../types";

// Bir kitabın tartışma soruları ve üyelerin cevapları.
// Soruları yönetici girer, cevabı herkes kendi adına yazar. Cevap kutusundan
// farkı: kimsenin sohbeti başlatması gerekmiyor ve her cevap tek başına
// anlamlı — kimse kimseye cevap vermese bile bölüm dolu görünür.
export function useDiscussion(bookId: string) {
  const { currentUser, isMember, isAdmin } = useApp();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Sorular herkese açık okunur.
  useEffect(() => {
    if (!bookId) return;
    const q = query(collection(db, "questions"), where("bookId", "==", bookId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question));
        list.sort((a, b) => a.order - b.order);
        setQuestions(list);
      },
      (err) => console.error("Sorular dinlenemedi:", err)
    );
    return unsub;
  }, [bookId]);

  // Cevaplar kulübün iç sohbeti — kurallarda girişe bağlı, ziyaretçide
  // dinleyiciyi hiç açmıyoruz.
  useEffect(() => {
    if (!bookId || !currentUser) {
      setAnswers([]);
      return;
    }
    const q = query(collection(db, "answers"), where("bookId", "==", bookId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Answer));
        list.sort((a, b) => a.createdAt - b.createdAt); // ilk cevap üstte
        setAnswers(list);
      },
      (err) => console.error("Cevaplar dinlenemedi:", err)
    );
    return unsub;
  }, [bookId, currentUser]);

  // ---- Yönetici: soru yönetimi ----

  async function addQuestion(text: string) {
    if (!isAdmin) return;
    const clean = text.trim().slice(0, 500);
    if (!clean) return;
    const enBuyuk = questions.reduce((m, q) => Math.max(m, q.order), 0);
    await addDoc(collection(db, "questions"), {
      bookId,
      text: clean,
      order: enBuyuk + 1,
      createdAt: Date.now(),
    });
  }

  async function updateQuestion(id: string, text: string) {
    if (!isAdmin) return;
    const clean = text.trim().slice(0, 500);
    if (!clean) return;
    await updateDoc(doc(db, "questions", id), { text: clean });
  }

  // Soruyu silerken ona verilmiş cevapları da siliyoruz — yoksa geride
  // hiçbir yerde görünmeyen yetim cevaplar kalır (kitap silmede yaşadığımız
  // sorunun aynısı).
  async function removeQuestion(id: string) {
    if (!isAdmin) return;
    const snap = await getDocs(
      query(collection(db, "answers"), where("questionId", "==", id))
    );
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, "questions", id));
  }

  // ---- Üye: kendi cevabı ----

  async function saveAnswer(questionId: string, text: string) {
    if (!currentUser || !isMember) return;
    const clean = text.trim().slice(0, 2000);
    if (!clean) return;
    const id = `${questionId}__${currentUser.id}`;
    const mevcut = answers.find((a) => a.id === id);
    await setDoc(
      doc(db, "answers", id),
      {
        questionId,
        bookId,
        userId: currentUser.id,
        text: clean,
        createdAt: mevcut?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  async function removeAnswer(questionId: string) {
    if (!currentUser) return;
    await deleteDoc(doc(db, "answers", `${questionId}__${currentUser.id}`));
  }

  function answersFor(questionId: string) {
    return answers.filter((a) => a.questionId === questionId);
  }

  function myAnswer(questionId: string): Answer | null {
    if (!currentUser) return null;
    return (
      answers.find(
        (a) => a.questionId === questionId && a.userId === currentUser.id
      ) ?? null
    );
  }

  return {
    questions,
    answersFor,
    myAnswer,
    addQuestion,
    updateQuestion,
    removeQuestion,
    saveAnswer,
    removeAnswer,
  };
}
