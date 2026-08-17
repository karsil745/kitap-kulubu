import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Katilim } from "../types";

// Bir ayın buluşmasına kimin geleceğini gerçek zamanlı yönetir.
// Belge id'si deterministik: `${month}__${userId}` — bir üye bir ay için tek
// kayıt tutar; tekrar işaretlemek günceller, ikinci belge açmaz (votes ile
// aynı desen).
export function useKatilim(month: string) {
  const { currentUser, isMember } = useApp();
  const [kayitlar, setKayitlar] = useState<Katilim[]>([]);

  // Kimin geleceği üyeler arası bilgi; kurallar okumayı giriş şartına bağlıyor.
  // Ziyaretçide dinleyiciyi hiç açmıyoruz (boşuna "permission-denied" basmasın).
  useEffect(() => {
    if (!currentUser) {
      setKayitlar([]);
      return;
    }
    // Tek alanlı sorgu → bileşik dizin (composite index) gerekmiyor.
    const q = query(collection(db, "katilim"), where("month", "==", month));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setKayitlar(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Katilim)));
      },
      (err) => console.error("Katılım kayıtları dinlenemedi:", err)
    );
    return unsub;
  }, [month, currentUser]);

  // Kendi işaretim (yoksa null — "cevap vermedim" hâli).
  const benimDurumum = useMemo(
    () =>
      currentUser
        ? kayitlar.find((k) => k.userId === currentUser.id)?.durum ?? null
        : null,
    [kayitlar, currentUser]
  );

  const gelenler = useMemo(
    () => kayitlar.filter((k) => k.durum === "geliyor"),
    [kayitlar]
  );

  // Katılımı işaretler. Aynı duruma ikinci kez basmak kaydı siler — fikir
  // değiştirmenin (ya da cevabı geri almanın) doğal yolu bu.
  async function isaretle(durum: Katilim["durum"]) {
    if (!currentUser || !isMember) return;
    if (benimDurumum === durum) {
      await kaldir();
      return;
    }
    await setDoc(
      doc(db, "katilim", `${month}__${currentUser.id}`),
      {
        month,
        userId: currentUser.id,
        durum,
        createdAt: Date.now(),
      },
      { merge: true }
    );
  }

  // Kendi kaydını siler. Kurallar da yalnızca kendi kaydına (ya da yöneticiye)
  // izin veriyor.
  async function kaldir() {
    if (!currentUser) return;
    await deleteDoc(doc(db, "katilim", `${month}__${currentUser.id}`));
  }

  return { kayitlar, benimDurumum, gelenler, isaretle, kaldir };
}
