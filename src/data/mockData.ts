import type { Author, Book, User } from "../types";
import { bookDescriptions, authorBios } from "./content";

// Şimdilik verileri buraya elle yazıyoruz (mock = sahte/örnek veri).
// İleride bunları gerçek bir veritabanından (örn. Supabase) çekeceğiz.

// ISBN numarasından ücretsiz gerçek kitap kapağı URL'si üretir.
// Kaynak: Open Library Covers API (ücretsiz).
export function coverFromIsbn(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

// Ana sayfadaki arka plan fotoğrafı (Unsplash, ücretsiz)
export const HERO_BG =
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1400&q=80";

// Kitapları gruplayacağımız dönemler / akımlar
export const ERAS = [
  "Victoria Dönemi",
  "Rus Klasikleri",
  "Modernizm",
  "Distopya",
  "Çağdaş",
] as const;

export const authors: Author[] = [
  {
    id: "a1",
    name: "Charlotte Brontë",
    birthYear: 1816,
    deathYear: 1855,
    bio: authorBios.a1,
    era: "Victoria Dönemi",
  },
  {
    id: "a2",
    name: "Fyodor Dostoyevski",
    birthYear: 1821,
    deathYear: 1881,
    bio: authorBios.a2,
    era: "Rus Klasikleri",
  },
  {
    id: "a3",
    name: "George Orwell",
    birthYear: 1903,
    deathYear: 1950,
    bio: authorBios.a3,
    era: "Distopya",
  },
  {
    id: "a4",
    name: "Virginia Woolf",
    birthYear: 1882,
    deathYear: 1941,
    bio: authorBios.a4,
    era: "Modernizm",
  },
];

export const books: Book[] = [
  {
    id: "b1",
    title: "Jane Eyre",
    authorId: "a1",
    era: "Victoria Dönemi",
    year: 1847,
    cover: "📕",
    coverImage: coverFromIsbn("9780141441146"),
    description: bookDescriptions.b1,
    recommendedBy: ["u1"],
  },
  {
    id: "b2",
    title: "Suç ve Ceza",
    authorId: "a2",
    era: "Rus Klasikleri",
    year: 1866,
    cover: "📗",
    coverImage: coverFromIsbn("9780486415871"),
    description: bookDescriptions.b2,
    recommendedBy: ["u2"],
  },
  {
    id: "b3",
    title: "1984",
    authorId: "a3",
    era: "Distopya",
    year: 1949,
    cover: "📘",
    coverImage: coverFromIsbn("9780451524935"),
    description: bookDescriptions.b3,
    recommendedBy: ["u1", "u2"],
  },
  {
    id: "b4",
    title: "Mrs Dalloway",
    authorId: "a4",
    era: "Modernizm",
    year: 1925,
    cover: "📙",
    coverImage: coverFromIsbn("9780156628709"),
    description: bookDescriptions.b4,
    recommendedBy: [],
  },
];

// Örnek üyeler. Gerçek giriş sistemi eklenene kadar bunları kullanacağız.
export const users: User[] = [
  {
    id: "u1",
    name: "Elif",
    bio: "Klasik romanların ve iyi bir çayın hayranı.",
  },
  {
    id: "u2",
    name: "Can",
    bio: "Distopya ve bilim kurgu okumayı seviyorum.",
  },
];

// Bu ayın kitabı (şimdilik sabit; ileride oylamayla belirlenecek)
export const bookOfTheMonthId = "b3";
