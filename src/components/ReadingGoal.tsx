import { useState } from "react";
import type { KeyboardEvent } from "react";
import { useApp } from "../context/AppContext";
import type { Shelf } from "../types";

// Profildeki yıllık okuma hedefi: kaç kitap hedeflendi, bu yıl kaçı bitti.
// Ayrı bir "hedef" koleksiyonu yok — sayı doğrudan users/{uid}.readingGoal'da,
// ilerleme de zaten var olan raf kayıtlarından (shelves) sayılıyor.
// Raflar prop olarak geliyor: ProfilePage zaten useMyShelves() ile dinliyor,
// burada ikinci bir onSnapshot açılmasın.
export default function ReadingGoal({ shelves }: { shelves: Shelf[] }) {
  const { currentUser, setReadingGoal } = useApp();
  const [taslak, setTaslak] = useState("");
  const [hata, setHata] = useState("");

  if (!currentUser) return null;

  const yil = new Date().getFullYear();
  // "Bitti" sayılması için raf durumu "read" ve bu yıl güncellenmiş olmalı.
  const okunan = shelves.filter(
    (s) => s.status === "read" && new Date(s.updatedAt).getFullYear() === yil
  ).length;
  const hedef = currentUser.readingGoal;

  async function kaydet() {
    const n = Number(taslak);
    if (taslak.trim() && Number.isInteger(n) && n > 0) {
      try {
        setHata("");
        await setReadingGoal(n);
      } catch (err) {
        console.error("Hedef kaydedilemedi:", err);
        setHata("Hedef kaydedilemedi, tekrar dene.");
        return;
      }
    }
    setTaslak("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    (e.target as HTMLInputElement).blur();
  }

  return (
    <section className="reading-goal">
      <h2>{yil} okuma hedefi</h2>

      {/* Başlık dışarıda, gövde kendi yüzeyinde: sayfanın geri kalanındaki
          "bölüm başlığı + içerik kartı" kalıbıyla aynı olsun diye. */}
      <div className="reading-goal-govde">
        {hedef && (
          <>
            <p className="reading-goal-summary">
              {okunan >= hedef
                ? `Hedefi tuttun — ${okunan} kitap 🎉`
                : `${okunan} / ${hedef} kitap`}
            </p>
            <span className="progress-track" aria-hidden="true">
              <span
                className="progress-fill"
                style={{ width: `${Math.min(100, Math.round((okunan / hedef) * 100))}%` }}
              />
            </span>
          </>
        )}

        {hata && <p className="hint error">{hata}</p>}
        <div className="progress-input">
          <label htmlFor="reading-goal-input">
            {hedef ? "Hedefi değiştir" : "Bu yıl kaç kitap okumak istersin?"}
          </label>
          <input
            id="reading-goal-input"
            type="number"
            min={1}
            max={1000}
            placeholder={hedef ? String(hedef) : "ör. 12"}
            value={taslak}
            onChange={(e) => setTaslak(e.target.value)}
            onBlur={kaydet}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </section>
  );
}
