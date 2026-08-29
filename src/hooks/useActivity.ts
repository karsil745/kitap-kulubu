import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Quote, Shelf } from "../types";

// Akıştaki tek bir olay. Ayrı bir "activity" koleksiyonu tutmuyoruz —
// her şey zaten mevcut koleksiyonlarda kayıtlı, akış onlardan türetiliyor.
// Böylece yazma yolu değişmiyor ve geriye dönük tüm hareketler de görünüyor.
export interface Activity {
  id: string;
  at: number;
  userId: string;
  bookId: string;
  kind: "review" | "quote" | "finished" | "reading" | "want" | "added";
  // Puan (yorumda) ya da yüzde (okuma ilerlemesinde)
  value?: number;
  // Arka arkaya gelen aynı tür hareket birleştirildiyse kaç tane olduğu
  count?: number;
}

// Eylemi kısa bir ifadeyle anlatır. Kitap adı ayrı bir öge olarak
// gösterildiği için Türkçe ek almasına gerek kalmıyor ("1984'ı" gibi
// yanlış çekimlerden böyle kaçınıyoruz).
export function hareketMetni(a: Activity, sayfa?: number): string {
  switch (a.kind) {
    case "review":
      return `★${a.value} verdi`;
    case "quote":
      return "alıntı ekledi";
    case "finished":
      return "bitirdi";
    case "reading":
      if (!a.value) return "okumaya başladı";
      return sayfa
        ? `okuyor · s. ${Math.round((a.value / 100) * sayfa)}`
        : `okuyor · %${a.value}`;
    case "added":
      return a.count && a.count > 1 ? `${a.count} kitap önerdi` : "önerdi";
    default:
      return "";
  }
}

export function useActivity(limit = 12) {
  const { reviews, books, currentUser } = useApp();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);

  // Tüm alıntılar (herkese açık okunur).
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "quotes"),
      (snap) =>
        setQuotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote))),
      (err) => console.error("Akış (alıntı) dinlenemedi:", err)
    );
    return unsub;
  }, []);

  // Tüm raflar — kurallarda giriş şartına bağlı, ziyaretçide hiç açmıyoruz.
  useEffect(() => {
    if (!currentUser) {
      setShelves([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "shelves"),
      (snap) =>
        setShelves(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shelf))),
      (err) => console.error("Akış (raf) dinlenemedi:", err)
    );
    return unsub;
  }, [currentUser]);

  return useMemo(() => {
    const events: Activity[] = [];

    for (const r of reviews) {
      events.push({
        id: `review-${r.id}`,
        at: r.updatedAt ?? r.createdAt,
        userId: r.userId,
        bookId: r.bookId,
        kind: "review",
        value: r.rating,
      });
    }

    for (const q of quotes) {
      events.push({
        id: `quote-${q.id}`,
        at: q.createdAt,
        userId: q.userId,
        bookId: q.bookId,
        kind: "quote",
      });
    }

    for (const s of shelves) {
      // "Okumak istiyorum" akışta gürültü yapıyor; sadece okuma başlangıcı,
      // ilerleme ve bitiş ilgi çekici.
      if (s.status === "want") continue;
      events.push({
        id: `shelf-${s.id}-${s.updatedAt}`,
        at: s.updatedAt,
        userId: s.userId,
        bookId: s.bookId,
        kind: s.status === "read" ? "finished" : "reading",
        value: s.progress,
      });
    }

    // Kitabı kütüphaneye ekleyen kişi, önerenler listesindeki ilk kişidir.
    // Eski kayıtları almıyoruz: arşiv/kurulum sırasında onlarca kitap aynı anda
    // eklendiği için akış baştan sona "önerdi" satırlarıyla doluyor. Yeni öneri
    // haberdir, haftalar önceki toplu içe aktarma değil. Puan, alıntı ve okuma
    // hareketlerine böyle bir sınır koymuyoruz — onlar seyrek ve hep ilgi çekici.
    const oneriSiniri = Date.now() - 14 * 24 * 60 * 60 * 1000;
    for (const b of books) {
      const owner = b.recommendedBy[0];
      if (!owner || !b.createdAt || b.createdAt < oneriSiniri) continue;
      events.push({
        id: `book-${b.id}`,
        at: b.createdAt,
        userId: owner,
        bookId: b.id,
        kind: "added",
      });
    }

    // Silinmiş kitaba ait kayıtları BURADA eliyoruz, gösterirken değil:
    // kırpma önce yapılıp satırlar sonra düşürülünce akış sessizce kısalıyor,
    // hepsi düşerse geriye başlığı olan boş bir liste kalıyordu.
    const kitapVar = new Set(books.map((b) => b.id));
    const sirali = events
      .filter((e) => kitapVar.has(e.bookId))
      .sort((a, b) => b.at - a.at);

    // Aynı kişinin arka arkaya eklediği kitapları tek satırda topla
    // ("Sıla 4 kitap önerdi"). Tek oturumda birkaç kitap eklemek normal;
    // her biri ayrı satır olunca akışı tek başına dolduruyor.
    const PENCERE = 60 * 60 * 1000;
    const birlesik: Activity[] = [];
    for (const e of sirali) {
      const onceki = birlesik[birlesik.length - 1];
      if (
        onceki &&
        onceki.kind === "added" &&
        e.kind === "added" &&
        onceki.userId === e.userId &&
        onceki.at - e.at < PENCERE
      ) {
        onceki.count = (onceki.count ?? 1) + 1;
        continue;
      }
      birlesik.push({ ...e });
    }

    return birlesik.slice(0, limit);
  }, [reviews, quotes, shelves, books, limit]);
}
