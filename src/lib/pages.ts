import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Author, Book } from "../types";

// Sayfa sayısı alanı sonradan eklendi; kütüphanedeki eski kitaplarda yok ve
// onlarda okuma ilerlemesi sayfa yerine yüzdeyle çalışıyor. Bu yardımcı,
// eksik olanları Open Library'den tek seferde tamamlar (yönetici çalıştırır).

// İlk arama sonucu çoğu zaman özet/kısaltılmış bir baskı oluyor (1984 için
// 72 sayfa gibi). Onun yerine baskı sayısı en yüksek kaydı seçiyoruz — o kayıt
// eserin asıl künyesi oluyor. Yine de tahmindir; Open Library'de Türkçe
// baskılar zayıf, o yüzden değer kitap sayfasından elle düzeltilebilir.
async function sayfaBul(baslik: string, yazar?: string): Promise<number | null> {
  const params = new URLSearchParams({
    title: baslik,
    limit: "5",
    fields: "number_of_pages_median,edition_count",
  });
  if (yazar) params.set("author", yazar);
  const res = await fetch(`https://openlibrary.org/search.json?${params}`);
  if (!res.ok) return null;
  const data = await res.json();

  const adaylar = (data?.docs ?? []).filter(
    (d: { number_of_pages_median?: number }) =>
      typeof d.number_of_pages_median === "number" &&
      d.number_of_pages_median > 0 &&
      d.number_of_pages_median <= 20000
  );
  if (adaylar.length === 0) return null;

  adaylar.sort(
    (a: { edition_count?: number }, b: { edition_count?: number }) =>
      (b.edition_count ?? 0) - (a.edition_count ?? 0)
  );
  return Math.round(adaylar[0].number_of_pages_median);
}

export interface SayfaSonucu {
  denenen: number;
  bulunan: number;
}

// Sayfa sayısı olmayan kitapları sırayla tarar. Open Library'yi yormamak için
// istekler peş peşe ve aralıklı gönderilir; hata veren kitap atlanır.
export async function sayfaSayilariniGetir(
  books: Book[],
  authors: Author[]
): Promise<SayfaSonucu> {
  const eksik = books.filter((b) => !b.pages);
  let bulunan = 0;

  for (const book of eksik) {
    const yazar = authors.find((a) => a.id === book.authorId)?.name;
    try {
      const sayfa = await sayfaBul(book.title, yazar);
      if (sayfa) {
        await updateDoc(doc(db, "books", book.id), { pages: sayfa });
        bulunan++;
      }
    } catch (err) {
      console.error(`Sayfa sayısı alınamadı (${book.title}):`, err);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  return { denenen: eksik.length, bulunan };
}
