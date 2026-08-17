import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Quote, User } from "../types";

// Alıntı yoksa kullanılacak yedek — kısa, okuma temalı özgün satırlar.
const FALLBACK_QUOTES = [
  "Bir kitap, bin hayata açılan sessiz bir kapıdır.",
  "Okumak, başkasının gözleriyle dünyayı yeniden görmektir.",
  "Her sayfa, geri dönülen bir yol; her kitap, yeni bir başlangıç.",
  "İyi bir kitap biter ama bıraktığı iz asla bitmez.",
  "Kelimeler kâğıtta uyur, okur onları uyandırır.",
  "Bir kitabı sevmek, onu bir arkadaşa anlatmakla tamamlanır.",
];

// Günün sözü havuzuna girme koşulları. Alıntının kendisi (kitap sayfasında)
// bunlardan etkilenmez; bunlar sadece ana sayfadaki vitrin için geçerli.
//
// 1) Uzunluk: kural 2000 karaktere izin veriyor, ama ana sayfada başlık
//    fontuyla gösterilen 2000 karakter yarım ekran kaplar.
const QOTD_MAX_UZUNLUK = 200;
// 2) Kişi başı tek alıntı: yoksa çok alıntı ekleyen kişi rotasyonu domine eder.
const QOTD_KISI_BASI = 1;

export interface QuoteOfTheDay {
  text: string;
  source: { bookId: string; bookTitle: string; authorName: string } | null;
  user: User | null;
  isFallback: boolean;
}

// Üyelerin eklediği tüm alıntılardan her gün deterministik biçimde birini
// seçer: herkes aynı gün aynı alıntıyı görür, gün değişince alıntı da değişir.
// Kararlı sıralama (id'ye göre) sayesinde snapshot sırası farklı gelse bile
// seçim sabit kalır.
export function useQuoteOfTheDay(): QuoteOfTheDay {
  const { books, authors, users } = useApp();
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "quotes"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote));
        list.sort((a, b) => a.id.localeCompare(b.id)); // Kararlı sıra
        setQuotes(list);
      },
      (err) => console.error("Günün sözü için alıntılar dinlenemedi:", err)
    );
    return unsub;
  }, []);

  const dayIndex = Math.floor(Date.now() / 86400000);

  // Vitrin havuzu: kısa alıntılar + her üyeden en fazla bir tane. `quotes`
  // zaten id'ye göre sıralı olduğu için "hangi alıntı" seçimi de kararlı.
  const kisiSayaci = new Map<string, number>();
  const havuz = quotes.filter((q) => {
    if (q.text.length > QOTD_MAX_UZUNLUK) return false;
    const adet = kisiSayaci.get(q.userId) ?? 0;
    if (adet >= QOTD_KISI_BASI) return false;
    kisiSayaci.set(q.userId, adet + 1);
    return true;
  });

  if (havuz.length === 0) {
    const text = FALLBACK_QUOTES[dayIndex % FALLBACK_QUOTES.length];
    return { text, source: null, user: null, isFallback: true };
  }

  const quote = havuz[dayIndex % havuz.length];
  const book = books.find((b) => b.id === quote.bookId);
  const author = book ? authors.find((a) => a.id === book.authorId) : undefined;
  const user = users.find((u) => u.id === quote.userId) ?? null;

  return {
    text: quote.text,
    source: book
      ? { bookId: book.id, bookTitle: book.title, authorName: author?.name ?? "" }
      : null,
    user,
    isFallback: false,
  };
}
