import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  BODY_COLORS,
  BODY_VARIANTS,
  BACKGROUND_COLORS,
  DEFAULT_FIGURE,
  EYES_VARIANTS,
  MOUTH_VARIANTS,
  figureSrc,
} from "../lib/figure";
import type { Figure } from "../types";

function randomFigure(): Figure {
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
  return {
    bodyVariant: pick(BODY_VARIANTS),
    bodyColor: pick(BODY_COLORS),
    eyesVariant: pick(EYES_VARIANTS),
    mouthVariant: pick(MOUTH_VARIANTS),
    backgroundColor: pick(BACKGROUND_COLORS),
  };
}

type ShapeField = "bodyVariant" | "eyesVariant" | "mouthVariant";

// İsimsiz görünen çok seçenekli satırlar (gövde şekli, gözler, ağız) için:
// ok tuşuyla tek tek gezmek yerine hepsi küçük birer önizleme olarak altta
// gösterilir. Zemin rengi kasıtlı olarak şeffaf: kullanıcının koyu zemin
// seçimi küçük karede şekli boğuyordu, seçenekleri ayırt etmek zorlaşıyordu.
function ShapeRow({
  label,
  field,
  options,
  draft,
  userId,
  onChange,
}: {
  label: string;
  field: ShapeField;
  options: readonly string[];
  draft: Figure;
  userId: string;
  onChange: (v: string) => void;
}) {
  const value = draft[field];
  return (
    <div className="figure-row figure-row-stacked">
      <span className="figure-row-label">{label}</span>
      <div className="figure-shapes">
        {options.map((v) => (
          <button
            key={v}
            type="button"
            className={v === value ? "figure-shape active" : "figure-shape"}
            aria-label={v}
            onClick={() => onChange(v)}
          >
            <img
              src={figureSrc(
                { ...draft, [field]: v, backgroundColor: "00000000" },
                userId
              )}
              alt=""
              width={62}
              height={62}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// Renk paleti satırı: küçük yuvarlak kartlar, seçili olan halkayla belli olur.
function SwatchRow({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="figure-row">
      <span className="figure-row-label">{label}</span>
      <div className="figure-swatches">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className={c === value ? "figure-swatch active" : "figure-swatch"}
            style={{ background: c }}
            aria-label={c}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}

// "Profili özelleştir" — kullanıcı kendi figürünü burada giydirir. Resim
// hiç yüklenmiyor/saklanmıyor; sadece 5 seçim (bkz. src/lib/figure.ts)
// Firestore'a yazılır, gösterim her yerde bu seçimlerden anlık kuruluyor.
export default function FigureBuilderPage() {
  const { currentUser, setFigure } = useApp();
  const navigate = useNavigate();
  usePageTitle("Profili özelleştir");

  const [draft, setDraft] = useState<Figure>(
    currentUser?.figure ?? DEFAULT_FIGURE
  );
  const [kaydediliyor, setKaydediliyor] = useState(false);

  if (!currentUser) return <Navigate to="/giris" replace />;

  function alan<K extends keyof Figure>(key: K) {
    return (v: Figure[K]) => setDraft((d) => ({ ...d, [key]: v }));
  }

  async function kaydet() {
    setKaydediliyor(true);
    try {
      await setFigure(draft);
      navigate("/profil");
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="section figure-builder">
      <div className="section-head">
        <h1>Profili özelleştir</h1>
        <Link to="/profil" className="link-more">
          Vazgeç
        </Link>
      </div>

      <div className="figure-stage">
        <img src={figureSrc(draft, currentUser.id)} alt="" width={180} height={180} />
        <button type="button" className="btn-ghost" onClick={() => setDraft(randomFigure())}>
          🎲 Rastgele dene
        </button>
      </div>

      <div className="figure-controls">
        <ShapeRow
          label="Gövde şekli"
          field="bodyVariant"
          options={BODY_VARIANTS}
          draft={draft}
          userId={currentUser.id}
          onChange={alan("bodyVariant")}
        />
        <SwatchRow
          label="Beden rengi"
          colors={BODY_COLORS}
          value={draft.bodyColor}
          onChange={alan("bodyColor")}
        />
        <ShapeRow
          label="Gözler"
          field="eyesVariant"
          options={EYES_VARIANTS}
          draft={draft}
          userId={currentUser.id}
          onChange={alan("eyesVariant")}
        />
        <ShapeRow
          label="Ağız"
          field="mouthVariant"
          options={MOUTH_VARIANTS}
          draft={draft}
          userId={currentUser.id}
          onChange={alan("mouthVariant")}
        />
        <SwatchRow
          label="Zemin rengi"
          colors={BACKGROUND_COLORS}
          value={draft.backgroundColor}
          onChange={alan("backgroundColor")}
        />
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={kaydet}
        disabled={kaydediliyor}
      >
        {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}
