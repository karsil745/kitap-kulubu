import { doc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { coverFromIsbn } from "./mockData";
import { bookDescriptions, authorBios } from "./content";
import type { Author, Book } from "../types";

// Kulübün bu zamana kadar okuduğu 5 kitap — sabit id'lerle tanımlanır ki
// `importPastBooks` her çalıştığında aynı belgelerin üzerine yazsın (idempotent).
// Bu veriler Firestore boş olmadığı için normal seed akışına girmez; bu yüzden
// yönetici, Takvim sayfasındaki bir düğmeyle elle içe aktarır.

// Yazarlar (id'siz alanlar Firestore'a yazılacak şekil)
export const pastAuthors: Author[] = [
  {
    id: "au-wilde",
    name: "Oscar Wilde",
    era: "Victoria Dönemi",
    birthYear: 1854,
    deathYear: 1900,
    bio: authorBios["au-wilde"],
  },
  {
    id: "au-kanafani",
    name: "Ghassan Kanafani",
    era: "Çağdaş",
    birthYear: 1936,
    deathYear: 1972,
    bio: authorBios["au-kanafani"],
  },
  {
    id: "au-ebronte",
    name: "Emily Brontë",
    era: "Victoria Dönemi",
    birthYear: 1818,
    deathYear: 1848,
    bio: authorBios["au-ebronte"],
  },
  {
    id: "au-lovecraft",
    name: "H. P. Lovecraft",
    era: "Korku & Gotik",
    birthYear: 1890,
    deathYear: 1937,
    bio: authorBios["au-lovecraft"],
  },
  {
    id: "au-jackson",
    name: "Shirley Jackson",
    era: "Korku & Gotik",
    birthYear: 1916,
    deathYear: 1965,
    bio: authorBios["au-jackson"],
  },
];

// Kitaplar + hangi aya yerleştirileceği (Okuma Takvimi arşivi için)
export const pastBooks: (Book & { readMonth: string })[] = [
  {
    id: "bk-dorian",
    title: "Dorian Gray'in Portresi",
    authorId: "au-wilde",
    era: "Victoria Dönemi",
    year: 1890,
    cover: "📕",
    coverImage: coverFromIsbn("9780141439570"),
    description: bookDescriptions["bk-dorian"],
    recommendedBy: [],
    readMonth: "2026-02",
  },
  {
    id: "bk-gunes",
    title: "Güneşteki Adamlar",
    authorId: "au-kanafani",
    era: "Çağdaş",
    year: 1962,
    cover: "📙",
    coverImage: coverFromIsbn("9781555974077"),
    description: bookDescriptions["bk-gunes"],
    recommendedBy: [],
    readMonth: "2026-03",
  },
  {
    id: "bk-ugultulu",
    title: "Uğultulu Tepeler",
    authorId: "au-ebronte",
    era: "Victoria Dönemi",
    year: 1847,
    cover: "📗",
    coverImage: coverFromIsbn("9780141439556"),
    description: bookDescriptions["bk-ugultulu"],
    recommendedBy: [],
    readMonth: "2026-04",
  },
  {
    id: "bk-delilik",
    title: "Deliliğin Dağlarında",
    authorId: "au-lovecraft",
    era: "Korku & Gotik",
    year: 1936,
    cover: "📘",
    coverImage: coverFromIsbn("9780812974416"),
    description: bookDescriptions["bk-delilik"],
    recommendedBy: [],
    readMonth: "2026-05",
  },
  {
    id: "bk-satoda",
    title: "Biz Hep Şatoda Yaşadık",
    authorId: "au-jackson",
    era: "Korku & Gotik",
    year: 1962,
    cover: "📓",
    coverImage: coverFromIsbn("9780143039976"),
    description: bookDescriptions["bk-satoda"],
    recommendedBy: [],
    readMonth: "2026-06",
  },
];

// Kulübün geçmişte okuduğu 5 kitabı (yazarları + kitapları + takvim
// kayıtlarını) tek seferde Firestore'a yazar. Sabit id'ler kullanıldığı için
// tekrar çağrılırsa üzerine yazar, çift kayıt oluşmaz (idempotent).
export async function importPastBooks(uid: string): Promise<void> {
  const batch = writeBatch(db);

  for (const author of pastAuthors) {
    const { id, ...rest } = author;
    batch.set(doc(db, "authors", id), rest);
  }

  for (const book of pastBooks) {
    const { id, readMonth, ...rest } = book;
    batch.set(doc(db, "books", id), {
      ...rest,
      recommendedBy: [],
      createdAt: Date.parse(`${readMonth}-01`),
    });
    batch.set(doc(db, "schedule", readMonth), {
      month: readMonth,
      bookId: id,
      setBy: uid,
      createdAt: Date.now(),
    });
  }

  await batch.commit();
}

// Yönetici için tek buton: hem geçmiş kitapları arşive aktarır (a) hem de
// çekirdek kitap/yazar belgelerinin açıklama ve biyografilerini content.ts'teki
// zengin metinlerle günceller (b). Sabit id'ler ve `merge: true` kullanıldığı
// için tekrar tekrar çalıştırılabilir (idempotent).
export async function syncAllContent(uid: string): Promise<void> {
  // (a) Geçmiş yazar/kitap/takvim kayıtlarını yaz (zaten zengin açıklamalarla)
  await importPastBooks(uid);

  // (b) Çekirdek (b1..b4 / a1..a4) kitap/yazar belgelerinin sadece
  // açıklama/bio alanlarını güncelle — merge: true olduğu için diğer
  // alanlar (kapak, yıl, vb.) korunur.
  const batch = writeBatch(db);
  for (const [id, description] of Object.entries(bookDescriptions)) {
    batch.set(doc(db, "books", id), { description }, { merge: true });
  }
  for (const [id, bio] of Object.entries(authorBios)) {
    batch.set(doc(db, "authors", id), { bio }, { merge: true });
  }
  await batch.commit();
}
