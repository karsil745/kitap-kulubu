// Zaman yardımcıları.

const DAKIKA = 60_000;
const SAAT = 60 * DAKIKA;
const GUN = 24 * SAAT;

// "2 saat önce", "dün", "3 gün önce" gibi kısa göreli zaman. Akışta tarih
// yerine bunu kullanıyoruz — "ne zaman" değil "yakın mı" bilgisi gerekiyor.
export function zamanOnce(ms: number, simdi = Date.now()): string {
  const fark = simdi - ms;
  if (fark < DAKIKA) return "az önce";
  if (fark < SAAT) return `${Math.floor(fark / DAKIKA)} dakika önce`;
  if (fark < GUN) return `${Math.floor(fark / SAAT)} saat önce`;
  if (fark < 2 * GUN) return "dün";
  if (fark < 30 * GUN) return `${Math.floor(fark / GUN)} gün önce`;
  return new Date(ms).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
}

// "24 Ağustos Pazar, 20.00" — buluşma satırında kullanılır.
export function bulusmaEtiketi(ms: number): string {
  return new Date(ms).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// İki zaman aynı takvim gününe mi düşüyor? (Sohbette gün ayracı için.)
export function ayniGun(a: number, b: number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

// Sohbetteki gün ayracı: "Bugün", "Dün" ya da "14 Ağustos 2026".
export function gunEtiketi(ms: number, simdi = Date.now()): string {
  if (ayniGun(ms, simdi)) return "Bugün";
  if (ayniGun(ms, simdi - GUN)) return "Dün";
  return new Date(ms).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// "20.14" — mesaj künyesindeki saat.
export function saatEtiketi(ms: number): string {
  return new Date(ms).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// <input type="datetime-local"> yerel saat bekler; Date'in ISO çıktısı UTC
// olduğu için dönüşümü elle yapıyoruz (yoksa saat kayar).
export function tarihGirdisine(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

export function tarihGirdisinden(value: string): number | null {
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

// Google Takvim'de "etkinlik ekle" formunu önceden doldurulmuş açar.
// Tarihler UTC ve saniyeli olmak zorunda: 20260824T170000Z
export function googleTakvimBaglantisi(opts: {
  baslik: string;
  baslangic: number;
  dakika?: number;
  detay?: string;
}): string {
  const utc = (ms: number) =>
    new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const bitis = opts.baslangic + (opts.dakika ?? 120) * 60_000;
  // `dates` alanındaki bölü işareti kodlanmamalı (bazı istemciler %2F'yi
  // ayıramıyor), o yüzden sorguyu URLSearchParams'a bırakmadan kuruyoruz.
  const parcalar = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(opts.baslik)}`,
    `dates=${utc(opts.baslangic)}/${utc(bitis)}`,
  ];
  if (opts.detay) parcalar.push(`details=${encodeURIComponent(opts.detay)}`);
  return `https://calendar.google.com/calendar/render?${parcalar.join("&")}`;
}
