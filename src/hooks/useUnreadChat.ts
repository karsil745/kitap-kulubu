import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useMessages } from "./useMessages";
import { useActivity } from "./useActivity";

// ChatPage'in birleştirdiği akışla aynı genişlik (bkz. ChatPage HAREKET_SAYISI)
const HAREKET_SAYISI = 40;

// Navbar'daki "Sohbet" rozeti için: son girişten beri kaç yeni mesaj/hareket
// birikmiş. Yeni bir koleksiyon açmıyoruz, ChatPage'in zaten okuduğu iki
// kaynağı (mesajlar + hareketler) `chatSeenAt` zaman damgasıyla karşılaştırıyoruz.
export function useUnreadChat() {
  const { currentUser, isMember } = useApp();
  const { mesajlar } = useMessages();
  const hareketler = useActivity(HAREKET_SAYISI);

  return useMemo(() => {
    if (!isMember || !currentUser) return 0;

    // Alan hiç yazılmamışsa (özellik yeni geldi ya da kişi sohbete hiç
    // girmedi) her şeyi "okunmamış" göstermek yanıltıcı olur — sohbete ilk
    // girişte gerçek zaman damgası yazılana kadar 0 gösteriyoruz.
    const seenAt = currentUser.chatSeenAt;
    if (!seenAt) return 0;

    const yeniMesaj = mesajlar.filter(
      (m) => m.createdAt > seenAt && m.uid !== currentUser.id
    ).length;
    const yeniHareket = hareketler.filter(
      (h) => h.at > seenAt && h.userId !== currentUser.id
    ).length;
    return yeniMesaj + yeniHareket;
  }, [isMember, currentUser, mesajlar, hareketler]);
}
