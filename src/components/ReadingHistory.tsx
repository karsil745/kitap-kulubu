import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useSchedule } from "../hooks/useSchedule";
import { currentMonth, monthLabel, monthSinceLabel } from "../lib/month";
import Cover from "./Cover";
import type { Book, ScheduleEntry } from "../types";

type Okunan = { kayit: ScheduleEntry; kitap: Book };

// Ana sayfadaki "Şimdiye kadar okuduklarımız" şeridi.
// Yeni veri yok: `schedule` koleksiyonu zaten bu bilgiyi tutuyordu, sadece
// /takvim sayfasının içinde saklı kalıyordu.
export default function ReadingHistory() {
  const { books } = useApp();
  const { archive } = useSchedule();
  const buAy = currentMonth();

  // İçinde bulunulan ay elenir (hero'da zaten duruyor, iki kere görünmesin);
  // karşılığı bulunamayan kitap kaydı da elenir (silinmiş kitap şeridi kırmasın).
  const okunanlar = useMemo<Okunan[]>(
    () =>
      archive
        .filter((kayit) => kayit.month !== buAy)
        .map((kayit) => ({ kayit, kitap: books.find((b) => b.id === kayit.bookId) }))
        .filter((x): x is Okunan => Boolean(x.kitap)),
    [archive, books, buAy]
  );

  // Hiç geçmiş kayıt yoksa bölüm hiç render edilmez — bu projede boş durum
  // metinleri bilinçli olarak kaldırılmıştı.
  if (okunanlar.length === 0) return null;

  // Sayfa toplamı ancak TÜM kitapların sayfa sayısı biliniyorsa yazılır;
  // eksik veriyle hesaplanan sayı gerçekte okunandan az görünür.
  const sayfaBilinen = okunanlar.every((x) => (x.kitap.pages ?? 0) > 0);
  const sayfaToplam = okunanlar.reduce((t, x) => t + (x.kitap.pages ?? 0), 0);
  const ilkAy = okunanlar[okunanlar.length - 1].kayit.month;

  const sayac = [
    `${okunanlar.length} kitap`,
    sayfaBilinen ? `${sayfaToplam.toLocaleString("tr-TR")} sayfa` : null,
    monthSinceLabel(ilkAy),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="section">
      <div className="section-head">
        <h2>Şimdiye kadar okuduklarımız</h2>
        <Link to="/takvim" className="link-more">
          Tümü →
        </Link>
      </div>
      <p className="hint gecmis-sayac">{sayac}</p>

      {/* Geçmiş bir akış, liste değil: dikey ızgara yerine yatay şerit. */}
      <div className="gecmis-serit">
        {okunanlar.map(({ kayit, kitap }) => (
          <Link key={kayit.id} to={`/kitap/${kitap.id}`} className="gecmis-oge">
            <Cover book={kitap} className="gecmis-kapak" />
            <span className="gecmis-ay">{monthLabel(kayit.month)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
