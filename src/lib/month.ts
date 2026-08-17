// Ay anahtarı yardımcıları. Ay anahtarı formatı hep "YYYY-MM" (örn. "2026-07").

// Şu anki ayın anahtarını döndürür.
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// Ay anahtarını okunabilir Türkçe etikete çevirir (örn. "Temmuz 2026").
export function monthLabel(m: string): string {
  return new Date(m + "-01").toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

// Yıla gelecek ayrılma eki, okunuşuna göre: 2025 "beş" → -ten, 2026 "altı" → -dan.
// Ek yanlış olunca ("2025'dan beri") satır hemen sırıtıyor, o yüzden elle tablo.
function yilAyrilmaEki(yil: number): string {
  const son2 = yil % 100;
  const son1 = yil % 10;
  if (son2 === 0) return "den"; // "iki bin" → bin'den
  if (son1 === 0) {
    // on, yirmi, otuz, kırk, elli, altmış, yetmiş, seksen, doksan
    const onlar: Record<number, string> = {
      10: "dan", 20: "den", 30: "dan", 40: "tan", 50: "den",
      60: "tan", 70: "ten", 80: "den", 90: "dan",
    };
    return onlar[son2] ?? "den";
  }
  const birler: Record<number, string> = {
    1: "den", 2: "den", 3: "ten", 4: "ten", 5: "ten",
    6: "dan", 7: "den", 8: "den", 9: "dan",
  };
  return birler[son1] ?? "den";
}

// "Mart 2025'ten beri" — kulüp sayacının son parçası.
export function monthSinceLabel(m: string): string {
  const yil = Number(m.slice(0, 4));
  return `${monthLabel(m)}'${yilAyrilmaEki(yil)} beri`;
}
