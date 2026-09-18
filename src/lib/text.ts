// Metin yardımcıları.

// Eski kayıtlarda açıklama alanı boş bırakılınca "Açıklama eklenmedi."
// dizesi YAZILMIŞTI — yani veride gerçek bir açıklama gibi duruyor. Editoryal
// düzende bu yer tutucu hero'nun ortasında boş bir cümle olarak görünüyor,
// o yüzden gösterirken yokmuş gibi davranıyoruz.
const YER_TUTUCU = "açıklama eklenmedi.";

// Karşılaştırma için metni sadeleştirir: küçük harf, Türkçe harfler ASCII
// karşılığına, noktalama ve fazla boşluk atılır. Hem mükerrer kitap tespitinde
// hem aramada kullanılır — böylece "Uğultulu" yazan da "ugultulu" yazan da
// aynı kitabı bulur, Open Library'den bozuk gelen adlar da eşleşir.
export function sadelestir(s: string): string {
  return (
    s
      // NFD ile harf ve aksan işaretini ayırıp işaretleri atıyoruz: ş→s, ğ→g,
      // ü→u, ç→c ama aynı zamanda ë→e, é→e, ñ→n de düzeliyor (Brontë, Kafka
      // çevirileri, yabancı yazar adları için gerekli).
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      // Noktasız ı ayrı bir harftir, aksan ayrıştırmasıyla düzelmez.
      .replace(/ı/g, "i")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
  );
}

// Ana sayfa için kısa açıklama: baştan tam cümleler, `sinir` karakteri
// aşmadan. İlk cümle bile uzunsa kelime sınırında kesip "…" ekler. Ayrıntı
// kitap sayfasında kalıyor; burada yalnızca merak uyandıracak kadar.
export function kisaAciklama(metin: string, sinir = 220): string {
  const cumleler = metin.match(/[^.!?…]+[.!?…]+["'”’)]*\s*/g) ?? [metin];
  let sonuc = "";
  for (const cumle of cumleler) {
    if ((sonuc + cumle).trim().length > sinir) break;
    sonuc += cumle;
  }
  sonuc = sonuc.trim();
  if (sonuc) return sonuc;
  const kesik = metin.slice(0, sinir);
  return kesik.slice(0, kesik.lastIndexOf(" ")).replace(/[\s,;:]+$/, "") + "…";
}

// Gösterilebilir bir açıklama varsa döner, yoksa null.
export function gercekAciklama(description?: string): string | null {
  const t = description?.trim();
  if (!t) return null;
  if (t.toLocaleLowerCase("tr").replace(/\s+/g, " ") === YER_TUTUCU) return null;
  return t;
}
