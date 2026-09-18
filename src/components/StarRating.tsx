import { useState } from "react";

// İki modlu yıldız bileşeni:
// - readOnly: sadece ortalama/puanı gösterir (ör. detay sayfası özeti)
// - onChange verilirse: tıklanabilir girdi olur (ör. yorum formu)
// - adet: (yalnız readOnly) verilirse ekran okuyucu değerlendirme sayısını da
//   duyar; sayının görsel hâli çağıran tarafta aria-hidden olmalı.
export default function StarRating({
  value,
  onChange,
  readOnly = false,
  adet,
}: {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  adet?: number;
}) {
  // Girdi modunda fare ile üzerine gelince önizleme göster
  const [hovered, setHovered] = useState<number | null>(null);

  const displayValue = hovered ?? value;
  const rounded = Math.round(displayValue);

  if (readOnly) {
    // Rolü olmayan bir span'daki aria-label okunmuyordu; ekran okuyucu tek tek
    // "siyah yıldız, beyaz yıldız…" diyordu. role="img" tek bir anlamlı ad
    // veriyor, yıldız karakterleri gizleniyor.
    const puan = value.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
    const etiket =
      `5 üzerinden ${puan} puan` +
      (adet !== undefined ? `, ${adet} değerlendirme` : "");
    return (
      <span className="star-rating" role="img" aria-label={etiket}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={n <= rounded ? "star filled" : "star"}
            aria-hidden="true"
          >
            {n <= rounded ? "★" : "☆"}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      className="star-rating star-rating-input"
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= rounded ? "star filled" : "star"}
          aria-label={`${n} yıldız ver`}
          onMouseEnter={() => setHovered(n)}
          onClick={() => onChange?.(n)}
        >
          {n <= rounded ? "★" : "☆"}
        </button>
      ))}
    </span>
  );
}
