import type { Figure } from "../types";

// DiceBear "Critters" — CC0 (kamu malı, kredi gerekmiyor), API anahtarı yok,
// ücretsiz. Resim hiç indirilip saklanmıyor; bu dosyadaki seçimlerden URL
// kurulup <img> ile gösteriliyor (kitap kapaklarını Open Library'den çekmemizle
// aynı mantık).
const DICEBEAR_BASE = "https://api.dicebear.com/10.x/critters/svg";

// Seçenekler DiceBear'ın kendi API'sinden örnekleyerek çıkarıldı (resmi bir
// "tüm seçenekler" listesi yayınlamıyorlar). Sıra, seçiciler arasında
// gezinirken (ok tuşları) tutarlı kalsın diye sabit.
export const BODY_VARIANTS = [
  "round", "blob", "dome", "squat", "tower", "tilt", "lean", "peak",
  "wedge", "wedgeInv", "chimney", "block", "steps", "bell",
];

export const EYES_VARIANTS = [
  "round", "wide", "happy", "sleepy", "wink", "squint", "angry", "inward",
  "close", "closedLine", "dots", "mono", "monoSleepy", "bigPupils", "four",
  "threeRow", "trio", "uneven",
];

export const MOUTH_VARIANTS = [
  "smile", "grin", "laugh", "open", "teeth", "tinySmile", "line", "slant",
  "smirk", "dot", "blep", "tongue", "catMouth", "zigzag", "sad", "tooth",
];

// Vücut ve zemin renkleri: DiceBear'ın kendi paletinden (pastel/koyu iki ayrı
// ton grubu — vücut açık, zemin koyu kalsın diye ayrı listeler).
export const BODY_COLORS = [
  "#fca5a5", "#fdba74", "#fcd34d", "#bef264", "#6ee7b9", "#5eead4",
  "#7dd3fc", "#a5b4fc", "#c4b5fd", "#f0abfc", "#fda4af", "#e2e8f0",
];

export const BACKGROUND_COLORS = [
  "#be123c", "#c2410c", "#b45309", "#047857", "#0f766e", "#0369a1",
  "#1d4ed8", "#4338ca", "#6d28d9", "#a21caf", "#be185d", "#1e293b",
];

export const DEFAULT_FIGURE: Figure = {
  bodyVariant: BODY_VARIANTS[0],
  bodyColor: BODY_COLORS[0],
  eyesVariant: EYES_VARIANTS[0],
  mouthVariant: MOUTH_VARIANTS[0],
  backgroundColor: BACKGROUND_COLORS[0],
};

// Bir kullanıcının avatar görselinin adresi. Figür seçilmişse ondan kurulur;
// seçilmemişse `seed` (kullanıcı kimliği) her girişte AYNI rastgele figürü
// üretir — kimse boş/bozuk görünmez ama hiçbir şey Firestore'a yazılmaz.
export function figureSrc(figure: Figure | undefined, seed: string): string {
  if (!figure) {
    return `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}`;
  }
  const params = new URLSearchParams({
    bodyVariant: figure.bodyVariant,
    bodyColor: figure.bodyColor,
    eyesVariant: figure.eyesVariant,
    mouthVariant: figure.mouthVariant,
    backgroundColor: figure.backgroundColor,
  });
  return `${DICEBEAR_BASE}?${params.toString()}`;
}
