import { useState } from "react";
import type { KeyboardEvent } from "react";
import { useApp } from "../context/AppContext";
import { useMyShelves } from "../hooks/useShelves";

// Profildeki yıllık okuma hedefi: kaç kitap hedeflendi, bu yıl kaçı bitti.
// Ayrı bir "hedef" koleksiyonu yok — sayı doğrudan users/{uid}.readingGoal'da,
// ilerleme de zaten var olan raf kayıtlarından (shelves) sayılıyor.
export default function ReadingGoal() {
  const { currentUser, setReadingGoal } = useApp();
  const { shelves } = useMyShelves();
  const [taslak, setTaslak] = useState("");

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
      await setReadingGoal(n);
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
    </section>
  );
}
