import { useCallback, useEffect, useRef, useState } from "react";

// Bir ögenin ekrana ilk girişini bildirir. Bir kez tetiklenir: `unobserve`
// çağrıldığı için yukarı-aşağı kaydırınca animasyon tekrar tekrar oynamaz.
//
// Dönen `ref` bir CALLBACK ref'tir, kasıtlı: ögeye bağlandığı anda gözlemci
// kurulur. Nesne ref + useEffect kalıbı burada sessizce bozuluyordu — ögesi
// veri gelene kadar `return null` diyen bir bileşende (ReadingHistory) efekt
// ilk render'da çalışıp `ref.current`'ı boş buluyor, bölüm sonradan çizilince
// bir daha denenmediği için gözlemci hiç kurulmuyor ve içerik `opacity: 0`'da
// kalıyordu.
//
// Kullanım:
//   const { ref, gorundu } = useGorunurluk<HTMLElement>();
//   <section ref={ref} className={gorundu ? "acilir" : undefined}>
export function useGorunurluk<T extends HTMLElement>(esik = 0.2) {
  const [gorundu, setGorundu] = useState(false);
  const gozlemciRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (oge: T | null) => {
      gozlemciRef.current?.disconnect();
      gozlemciRef.current = null;
      if (!oge) return;

      // Gözlemci desteklenmiyorsa içerik gizli kalmasın — son hâline geç.
      if (typeof IntersectionObserver === "undefined") {
        setGorundu(true);
        return;
      }

      const gozlemci = new IntersectionObserver(
        (girdiler) => {
          for (const girdi of girdiler) {
            if (!girdi.isIntersecting) continue;
            setGorundu(true);
            gozlemci.disconnect(); // bir kez yeter
          }
        },
        { threshold: esik }
      );
      gozlemci.observe(oge);
      gozlemciRef.current = gozlemci;
    },
    [esik]
  );

  // Bileşen sökülürken gözlemci arkada kalmasın.
  useEffect(() => () => gozlemciRef.current?.disconnect(), []);

  return { ref, gorundu };
}
