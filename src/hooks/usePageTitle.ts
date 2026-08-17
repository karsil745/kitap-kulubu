import { useEffect } from "react";

const SITE = "Bibliyofili Kitap Kulübü";

// Sayfa başlığını (tarayıcı sekmesi) rotaya göre ayarlar.
// title verilmezse (veri henüz yüklenmediyse) sadece site adı kalır.
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
    return () => {
      document.title = SITE;
    };
  }, [title]);
}
