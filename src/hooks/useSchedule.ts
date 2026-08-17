import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { ScheduleEntry } from "../types";
import { currentMonth } from "../lib/month";

// Aylık okuma takvimini (geçmiş + şu anki ay) gerçek zamanlı dinler.
// Kayıtlar yönetici tarafından oylama kesinleştiğinde (veya elle) yazılır.
export function useSchedule() {
  const { isAdmin } = useApp();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "schedule"),
      (snap) => {
        setEntries(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduleEntry))
        );
      },
      (err) => console.error("Takvim dinlenemedi:", err)
    );
    return unsub;
  }, []);

  // Şu anki aya ait kayıt.
  const current = useMemo(
    () => entries.find((e) => e.month === currentMonth()) ?? null,
    [entries]
  );

  // Tüm kayıtlar, ay'a göre azalan (en yeni ay üstte).
  const archive = useMemo(
    () => [...entries].sort((a, b) => (a.month < b.month ? 1 : -1)),
    [entries]
  );

  // Belirli bir aya ait kaydı bulur.
  function byMonth(m: string): ScheduleEntry | null {
    return entries.find((e) => e.month === m) ?? null;
  }

  // O ayın buluşma zamanını ayarlar (null → kaldırır). Sadece yönetici;
  // kurallar da schedule yazımını isAdmin() ile sınırlıyor.
  async function setMeeting(month: string, ms: number | null) {
    if (!isAdmin) return;
    await setDoc(doc(db, "schedule", month), { meetingAt: ms }, { merge: true });
  }

  return { current, archive, byMonth, setMeeting };
}
