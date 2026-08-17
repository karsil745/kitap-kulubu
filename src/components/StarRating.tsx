import { useState } from "react";

// İki modlu yıldız bileşeni:
// - readOnly: sadece ortalama/puanı gösterir (ör. detay sayfası özeti)
// - onChange verilirse: tıklanabilir girdi olur (ör. yorum formu)
export default function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
}) {
  // Girdi modunda fare ile üzerine gelince önizleme göster
  const [hovered, setHovered] = useState<number | null>(null);

  const displayValue = hovered ?? value;
  const rounded = Math.round(displayValue);

  if (readOnly) {
    return (
      <span className="star-rating" aria-label={`${value} / 5 yıldız`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rounded ? "star filled" : "star"}>
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
