import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useShelf } from "../hooks/useShelves";
import type { ShelfStatus } from "../types";

// Kitap detayında kullanıcının kişisel raf durumunu seçmesini sağlar:
// okudum / okuyorum / okumak istiyorum. Onaylı üye değilse hiç gösterilmez.
const OPTIONS: { status: ShelfStatus; label: string }[] = [
  { status: "read", label: "Okudum" },
  { status: "reading", label: "Okuyorum" },
  { status: "want", label: "Okumak istiyorum" },
];

export default function ShelfPicker({ bookId }: { bookId: string }) {
  const { isMember, books } = useApp();
  const { status, progress, setStatus, setProgress } = useShelf(bookId);

  // Sürüklerken her pikselde Firestore'a yazmamak için yüzdeyi önce yerelde
  // tutuyoruz; kaydetme parmağı/fareyi bırakınca bir kez oluyor.
  const [local, setLocal] = useState(progress);
  useEffect(() => setLocal(progress), [progress]);

  // Sayfa sayısı biliniyorsa yüzde yerine sayfa soruyoruz — kimse "%35'teyim"
  // diye düşünmez, "120. sayfadayım" der. Kayıt yine yüzde olarak tutulur,
  // böylece sayfa sayısı sonradan düzeltilse de ilerleme anlamlı kalır.
  const toplamSayfa = books.find((b) => b.id === bookId)?.pages;
  const [sayfa, setSayfa] = useState("");
  useEffect(() => {
    if (!toplamSayfa) return;
    setSayfa(progress ? String(Math.round((progress / 100) * toplamSayfa)) : "");
  }, [progress, toplamSayfa]);

  async function sayfaKaydet() {
    if (!toplamSayfa) return;
    const n = Number(sayfa);
    if (!Number.isFinite(n) || n < 0) return;
    const kirpilmis = Math.min(toplamSayfa, Math.max(0, Math.round(n)));
    await setProgress((kirpilmis / toplamSayfa) * 100);
  }

  if (!isMember) return null;

  return (
    <div className="shelf-picker">
      <p className="shelf-picker-title">Rafım</p>
      <div className="shelf-picker-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.status}
            type="button"
            className={status === opt.status ? "chip active" : "chip"}
            onClick={() => setStatus(opt.status)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {status === "reading" &&
        (toplamSayfa ? (
          <div className="progress-input">
            <label htmlFor="progress-page">Kaçıncı sayfadasın?</label>
            <input
              id="progress-page"
              type="number"
              min={0}
              max={toplamSayfa}
              value={sayfa}
              onChange={(e) => setSayfa(e.target.value)}
              onBlur={sayfaKaydet}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sayfaKaydet();
                }
              }}
            />
            <span className="progress-input-value">
              / {toplamSayfa}
              {progress ? ` · %${progress}` : ""}
            </span>
          </div>
        ) : (
          <div className="progress-input">
            <label htmlFor="progress-range">Nerede kaldın?</label>
            <input
              id="progress-range"
              type="range"
              min={0}
              max={100}
              step={5}
              value={local}
              onChange={(e) => setLocal(Number(e.target.value))}
              onPointerUp={() => setProgress(local)}
              onKeyUp={() => setProgress(local)}
            />
            <span className="progress-input-value">%{local}</span>
          </div>
        ))}
    </div>
  );
}
