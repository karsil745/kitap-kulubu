import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { sadelestir } from "../lib/text";
import { ERAS, coverFromIsbn } from "../data/mockData";
import BookCard from "../components/BookCard";
import type { Book } from "../types";

type Siralama = "yeni" | "puan" | "ad" | "yil";

const SIRALAMALAR: { value: Siralama; label: string }[] = [
  { value: "yeni", label: "Yeni eklenen" },
  { value: "puan", label: "En yüksek puan" },
  { value: "ad", label: "Ada göre (A–Z)" },
  { value: "yil", label: "Yayın yılı" },
];

// Kitaplar sayfası: arama + döneme göre filtreleme + sıralama + öneri formu.
export default function BooksPage() {
  const { books, reviews, authors, isMember } = useApp();
  usePageTitle("Kitaplar");
  const [activeEra, setActiveEra] = useState<string>("Hepsi");
  const [showForm, setShowForm] = useState(false);
  const [arama, setArama] = useState("");
  const [siralama, setSiralama] = useState<Siralama>("yeni");

  // Filtre çipleri: önce sabit ERAS sırası, sonra kitaplarda geçen ama
  // ERAS'ta olmayan ekstra dönemler (kullanıcı yeni bir dönem girmiş olabilir).
  const eraList: readonly string[] = ERAS;
  const extraEras = Array.from(
    new Set(books.map((b) => b.era).filter((era) => era && !eraList.includes(era)))
  );
  const eraChips = [...ERAS, ...extraEras];

  // Kitap başına ortalama puan — hem sıralama hem sayaç için bir kez hesaplanır.
  const ortalamalar = useMemo(() => {
    const toplam = new Map<string, { top: number; adet: number }>();
    for (const r of reviews) {
      const t = toplam.get(r.bookId) ?? { top: 0, adet: 0 };
      t.top += r.rating;
      t.adet += 1;
      toplam.set(r.bookId, t);
    }
    const out = new Map<string, number>();
    for (const [id, t] of toplam) out.set(id, t.top / t.adet);
    return out;
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = sadelestir(arama);
    let list = activeEra === "Hepsi" ? books : books.filter((b) => b.era === activeEra);

    // Arama hem kitap adında hem yazar adında geçer — "Brontë" yazan da,
    // "bronte" yazan da aynı sonuca ulaşsın diye ikisi de sadeleştirilir.
    if (q) {
      list = list.filter((b) => {
        const yazar = authors.find((a) => a.id === b.authorId)?.name ?? "";
        return (
          sadelestir(b.title).includes(q) || sadelestir(yazar).includes(q)
        );
      });
    }

    const sirali = [...list];
    switch (siralama) {
      case "puan":
        // Puanı olmayanlar sona düşsün — 0 puanlı gibi görünmesinler.
        sirali.sort(
          (a, b) => (ortalamalar.get(b.id) ?? -1) - (ortalamalar.get(a.id) ?? -1)
        );
        break;
      case "ad":
        sirali.sort((a, b) => a.title.localeCompare(b.title, "tr"));
        break;
      case "yil":
        sirali.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
        break;
      default:
        // Varsayılan sıra AppContext'te zaten createdAt'e göre (yeni üstte)
        break;
    }
    return sirali;
  }, [books, authors, activeEra, arama, siralama, ortalamalar]);

  return (
    <div className="section">
      <div className="section-head">
        <h2>Kitaplar</h2>
        <span className="hint">
          {filtered.length === books.length
            ? `${books.length} kitap`
            : `${filtered.length} / ${books.length} kitap`}
        </span>
        {isMember && (
          <button
            className="btn-primary"
            onClick={() => setShowForm((s) => !s)}
          >
            {showForm ? "Vazgeç" : "+ Kitap Öner"}
          </button>
        )}
      </div>

      {showForm && <AddBookForm onDone={() => setShowForm(false)} />}

      <div className="book-tools">
        <input
          className="book-search"
          type="search"
          placeholder="Kitap ya da yazar ara"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
        />
        <select
          className="book-sort"
          value={siralama}
          onChange={(e) => setSiralama(e.target.value as Siralama)}
          aria-label="Sıralama"
        >
          {SIRALAMALAR.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dönem filtreleri */}
      <div className="filters">
        <button
          className={activeEra === "Hepsi" ? "chip active" : "chip"}
          onClick={() => setActiveEra("Hepsi")}
        >
          Hepsi
        </button>
        {eraChips.map((era) => (
          <button
            key={era}
            className={activeEra === era ? "chip active" : "chip"}
            onClick={() => setActiveEra(era)}
          >
            {era}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          {arama
            ? `“${arama}” için sonuç yok.`
            : "Bu dönemde henüz kitap yok."}
          {arama && (
            <>
              {" "}
              <button className="link-button" onClick={() => setArama("")}>
                Aramayı temizle
              </button>
            </>
          )}
        </p>
      ) : (
        <div className="book-grid">
          {filtered.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}

// Open Library arama sonucu için minimal tip (sadece istediğimiz alanlar)
interface OpenLibraryResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  // Baskılar arasında değiştiği için Open Library medyan değeri veriyor
  number_of_pages_median?: number;
}

// Yeni kitap önerme formu (ayrı küçük bileşen)
function AddBookForm({ onDone }: { onDone: () => void }) {
  const { addBook, ensureAuthor, books } = useApp();
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [era, setEra] = useState<string>(ERAS[0]);
  const [description, setDescription] = useState("");

  // Arama sonucundan otomatik dolan (ama elle de değiştirilebilen) alanlar
  const [year, setYear] = useState<number | undefined>(undefined);
  const [pages, setPages] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  // Açıklama internetten (Open Library) çekilirken gösterilen durum
  const [descLoading, setDescLoading] = useState(false);
  // Aynı kitap zaten kayıtlıysa uyarı (kullanıcı yine de ekleyebilir)
  const [duplicate, setDuplicate] = useState<Book | null>(null);

  // Open Library arama akışı
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<OpenLibraryResult[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  async function handleSearch() {
    const q = title.trim();
    if (!q) return;
    setSearching(true);
    setSearched(false);
    setSelectedKey(null);
    try {
      const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(
        q
      )}&limit=5&fields=key,title,author_name,first_publish_year,cover_i,isbn,number_of_pages_median`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(Array.isArray(data.docs) ? data.docs : []);
    } catch (err) {
      // Ağ hatasında sessiz düş — elle giriş çalışmaya devam etsin
      console.error("Open Library araması başarısız:", err);
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  }

  async function handlePick(result: OpenLibraryResult) {
    setSelectedKey(result.key);
    setTitle(result.title);
    setDuplicate(null);
    setAuthorName(result.author_name?.[0] ?? "");
    setYear(result.first_publish_year);
    setPages(
      result.number_of_pages_median ? String(result.number_of_pages_median) : ""
    );
    if (result.cover_i) {
      setCoverImage(`https://covers.openlibrary.org/b/id/${result.cover_i}-L.jpg`);
    } else if (result.isbn?.[0]) {
      setCoverImage(coverFromIsbn(result.isbn[0]));
    } else {
      setCoverImage(undefined);
    }
    // Seçilen kitabın açıklamasını Open Library "work" kaydından otomatik çek.
    // Bu metin çoğunlukla İngilizcedir; başlangıç olarak dolar, kullanıcı düzenler.
    setDescLoading(true);
    try {
      const res = await fetch(`https://openlibrary.org${result.key}.json`);
      const data = await res.json();
      // "description" alanı düz metin ya da { value } nesnesi olabilir
      let desc = data.description;
      if (desc && typeof desc === "object") desc = desc.value;
      if (typeof desc === "string" && desc.trim()) {
        // Open Library açıklamalarındaki markdown ve kaynak eklerini temizle:
        // - sonundaki "----" ayracı ve kaynak dipnotlarını at
        // - markdown vurgularını (** __) ve bağlantı köşeli parantezlerini sadeleştir
        desc = desc
          .split(/\n-{3,}/)[0]
          .replace(/\(\[source\]\[\d+\]\)/gi, "")
          .replace(/\[([^\]]+)\]\[\d+\]/g, "$1")
          .replace(/[*_]{1,2}/g, "")
          .trim();
        setDescription(desc);
      }
    } catch (err) {
      // Ağ/veri hatasında sessiz düş — kullanıcı elle yazabilir
      console.error("Açıklama getirilemedi:", err);
    } finally {
      setDescLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    // Aynı kitap zaten var mı? İlk denemede uyar, ikinci denemede (uyarı
    // ekrandayken tekrar gönderilirse) kullanıcının kararına uy.
    if (!duplicate) {
      const norm = sadelestir(title);
      const existing = books.find((b) => sadelestir(b.title) === norm);
      if (existing) {
        setDuplicate(existing);
        return;
      }
    }

    // Yazar zaten var mı bak (ada göre); yoksa yeni yazar belgesi oluştur
    const authorId = await ensureAuthor(authorName.trim(), era);
    addBook({
      title: title.trim(),
      authorId,
      era,
      year,
      // Sayfa sayısı okuma ilerlemesini "%35" yerine "120. sayfa" yapıyor;
      // geçersiz/boş girilirse hiç yazmıyoruz.
      pages: Number(pages) > 0 ? Math.round(Number(pages)) : undefined,
      cover: "📖",
      coverImage,
      // Boşsa yer tutucu YAZMA — boş bırak. Yer tutucu metin editoryal
      // düzende gerçek bir açıklama gibi görünüp hero'yu bozuyordu.
      description: description.trim(),
    });
    onDone();
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <div className="book-search-row">
        <input
          placeholder="Kitap adı"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            // Başlık elle değiştirilince eski seçim ve uyarı artık geçerli değil
            setSelectedKey(null);
            setDuplicate(null);
          }}
          onKeyDown={handleTitleKeyDown}
        />
        <button
          type="button"
          className="btn-ghost"
          onClick={handleSearch}
          disabled={searching || !title.trim()}
        >
          {searching ? "Aranıyor…" : "Ara"}
        </button>
      </div>

      {searched && !searching && results.length === 0 && (
        <p className="hint">Sonuç bulunamadı, bilgileri elle girebilirsin.</p>
      )}

      {results.length > 0 && (
        <div className="book-search-results">
          {results.map((r) => (
            <button
              type="button"
              key={r.key}
              className={
                selectedKey === r.key
                  ? "book-search-result selected"
                  : "book-search-result"
              }
              onClick={() => handlePick(r)}
            >
              <span className="book-search-result-cover">
                {r.cover_i ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${r.cover_i}-M.jpg`}
                    alt=""
                  />
                ) : (
                  <span className="cover-emoji">📖</span>
                )}
              </span>
              <span className="book-search-result-info">
                <span className="book-search-result-title">{r.title}</span>
                <span className="book-search-result-meta">
                  {r.author_name?.[0] ?? "Bilinmeyen yazar"}
                  {r.first_publish_year ? ` · ${r.first_publish_year}` : ""}
                  {r.number_of_pages_median
                    ? ` · ${r.number_of_pages_median} sayfa`
                    : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <input
        placeholder="Yazar"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
      />
      <select value={era} onChange={(e) => setEra(e.target.value)}>
        {ERAS.map((er) => (
          <option key={er} value={er}>
            {er}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        placeholder="Sayfa sayısı (okuma ilerlemesi için)"
        value={pages}
        onChange={(e) => setPages(e.target.value)}
      />
      {descLoading && (
        <p className="hint">Açıklama internetten getiriliyor…</p>
      )}
      <textarea
        placeholder="Kısa açıklama (aramadan otomatik gelebilir)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {selectedKey && !descLoading && (
        <p className="hint">
          İnternetten gelen açıklama İngilizce olabilir — dilediğin gibi
          düzenleyebilirsin.
        </p>
      )}
      {duplicate && (
        <p className="hint dup-warning">
          <strong>“{duplicate.title}”</strong> zaten kütüphanede — aynı kitabı
          ikinci kez eklemek oylamada oyu böler.{" "}
          <Link to={`/kitap/${duplicate.id}`}>Var olanı aç →</Link>
          <br />
          Farklı bir kitapsa "Öneriyi Ekle"ye tekrar bas.
        </p>
      )}

      <button className="btn-primary" type="submit">
        Öneriyi Ekle
      </button>
    </form>
  );
}
