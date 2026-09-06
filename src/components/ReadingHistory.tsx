import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useSchedule } from "../hooks/useSchedule";
import { useGorunurluk } from "../hooks/useGorunurluk";
import { currentMonth, monthLabel, monthSinceLabel } from "../lib/month";
import Cover from "./Cover";
import type { Book, ScheduleEntry } from "../types";

type Okunan = { kayit: ScheduleEntry; kitap: Book };

const SAYAC_SURESI = 800; // ms

// Hareketi kapatmış kullanıcı sayıyı da beklemeden görmeli.
function hareketKapali() {
  return (
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Tek bir sayıyı 0'dan hedefe sayar. `oyna` false iken (henüz görünmedi ya da
// hareket kapalı) doğrudan son değeri gösterir — sayfada asla "0" takılı kalmaz.
function Sayac({ deger, oyna }: { deger: number; oyna: boolean }) {
  const [gosterilen, setGosterilen] = useState(deger);

  useEffect(() => {
    if (!oyna || hareketKapali()) {
      setGosterilen(deger);
      return;
    }
    let kare = 0;
    const baslangic = performance.now();
    const adim = (simdi: number) => {
      const t = Math.min(1, (simdi - baslangic) / SAYAC_SURESI);
      const yumusak = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setGosterilen(Math.round(deger * yumusak));
      if (t < 1) kare = requestAnimationFrame(adim);
    };
    kare = requestAnimationFrame(adim);
    return () => cancelAnimationFrame(kare);
  }, [deger, oyna]);

  // Binlik ayracı nokta: 4.312
  return <span className="sayac-deger">{gosterilen.toLocaleString("tr-TR")}</span>;
}

// Ana sayfadaki "Şimdiye kadar okuduklarımız" şeridi.
// Yeni veri yok: `schedule` koleksiyonu zaten bu bilgiyi tutuyordu, sadece
// /takvim sayfasının içinde saklı kalıyordu.
export default function ReadingHistory() {
  const { books } = useApp();
  const { archive } = useSchedule();
  const buAy = currentMonth();
  // Şeridin açılması ve sayaç aynı gözlemciyi paylaşır (iki tane açmaya gerek yok).
  const { ref, gorundu } = useGorunurluk<HTMLElement>(0.2);

  // Gizleyen sınıf yalnızca JS çalışıyorsa ekleniyor: JS bir sebeple çalışmazsa
  // kapaklar animasyonsuz ama GÖRÜNÜR kalır.
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

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

  const seritSinifi = [
    "gecmis-serit",
    hazir ? "serit-hazir" : "",
    gorundu ? "serit-acilir" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="section gecmis-bolum" ref={ref}>
      {/* Başlık ve sayaç tek künye bloğu: sayaç eskiden negatif margin ile
          başlığın altına çekiliyordu, artık aynı satırın parçası. */}
      <div className="section-head">
        <div className="gecmis-kunye">
          <h2>Şimdiye kadar okuduklarımız</h2>
          {/* Sayılar kendi elemanlarında; aradaki ayraçlar ve tarih metni
              sabit. "…'ten beri" bir tarih, sayı değil — canlandırılmıyor. */}
          <p className="hint gecmis-sayac">
            <Sayac deger={okunanlar.length} oyna={gorundu} /> kitap
            {sayfaBilinen && (
              <>
                {" · "}
                <Sayac deger={sayfaToplam} oyna={gorundu} /> sayfa
              </>
            )}
            {" · "}
            {monthSinceLabel(ilkAy)}
          </p>
        </div>
        <Link to="/takvim" className="link-more">
          Tümü →
        </Link>
      </div>

      {/* Geçmiş bir akış, liste değil: dikey ızgara yerine yatay şerit. */}
      <div className={seritSinifi}>
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
