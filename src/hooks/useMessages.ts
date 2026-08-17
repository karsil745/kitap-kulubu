import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useApp } from "../context/AppContext";
import type { Message } from "../types";

// Sohbet odasının son mesajlarını gerçek zamanlı yönetir.
// Tek `orderBy`, `where` yok — bu yüzden bileşik dizin (composite index) gerekmez.
const SON_MESAJ_SAYISI = 100;

export function useMessages() {
  const { currentUser, isMember } = useApp();
  const [mesajlar, setMesajlar] = useState<Message[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Dinleyiciyi SADECE onaylı üyede aç. Kurallarda okuma da isMember() şartına
  // bağlı; ziyaretçide/onaysız kişide açarsak boşuna "permission-denied" basar.
  useEffect(() => {
    if (!isMember) {
      setMesajlar([]);
      setYukleniyor(false);
      return;
    }
    setYukleniyor(true);
    // En yeni 100 mesajı çek, sonra ters çevirip eskiden yeniye göster.
    const q = query(
      collection(db, "mesajlar"),
      orderBy("createdAt", "desc"),
      limit(SON_MESAJ_SAYISI)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
        list.reverse(); // Eskiden yeniye — sohbet aşağı doğru akar
        setMesajlar(list);
        setYukleniyor(false);
      },
      (err) => {
        console.error("Mesajlar dinlenemedi:", err);
        setYukleniyor(false);
      }
    );
    return unsub;
  }, [isMember]);

  // Yeni mesaj gönderir (giriş yapan üye adına).
  async function gonder(metin: string) {
    // Arayüz zaten göstermeyecek ama savunma amaçlı burada da duruyor.
    if (!currentUser || !isMember) return;
    // Uzunluk sınırı kurallarda da var — dev belgelerle kota şişirilmesin.
    const temiz = metin.trim().slice(0, 2000);
    if (!temiz) return;
    await addDoc(collection(db, "mesajlar"), {
      uid: currentUser.id,
      metin: temiz,
      createdAt: Date.now(),
      // İleriye dönük sigorta: bugün sorgularda kullanılmıyor.
      grupId: "bibliyofili",
    });
  }

  // Bir mesajı siler. Kurallar zorlar: kendi mesajın ya da yöneticiysen herkesinki.
  async function sil(id: string) {
    await deleteDoc(doc(db, "mesajlar", id));
  }

  return { mesajlar, gonder, sil, yukleniyor };
}
