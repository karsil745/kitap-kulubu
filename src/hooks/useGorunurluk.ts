import { useEffect, useRef, useState } from "react";

// Bir ögenin ekrana ilk girişini bildirir. Bir kez tetiklenir: `unobserve`
// çağrıldığı için yukarı-aşağı kaydırınca animasyon tekrar tekrar oynamaz.
//
// Kullanım:
//   const { ref, gorundu } = useGorunurluk<HTMLElement>();
//   <section ref={ref} className={gorundu ? "acilir" : undefined}>
export function useGorunurluk<T extends HTMLElement>(esik = 0.2) {
  const ref = useRef<T | null>(null);
  const [gorundu, setGorundu] = useState(false);

  useEffect(() => {
    const oge = ref.current;
    if (!oge) return;

    // Gözlemci desteklenmiyorsa içerik gizli kalmasın — doğrudan son hâline geç.
    if (typeof IntersectionObserver === "undefined") {
      setGorundu(true);
      return;
    }

    const gozlemci = new IntersectionObserver(
      (girdiler) => {
        for (const girdi of girdiler) {
          if (!girdi.isIntersecting) continue;
          setGorundu(true);
          gozlemci.unobserve(girdi.target); // bir kez yeter
        }
      },
      { threshold: esik }
    );

    gozlemci.observe(oge);
    return () => gozlemci.disconnect();
  }, [esik]);

  return { ref, gorundu };
}
