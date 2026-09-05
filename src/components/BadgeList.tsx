import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useBadges } from "../hooks/useBadges";
import { BADGE_ICON_PATHS, BADGE_INK_GRAIN_BASE64 } from "../lib/badgeIcons";

// Her rozetin sabit bir "duruşu" var — gerçek bir mühür aletinin her
// basışta aynı biçimde çıkması gibi, rastgele değil. Rozet id'sinden
// türetiliyor ki yeni bir rozet eklenince elle bir satır eklemeyi unutmayalım.
function stanceFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const sign = hash % 2 === 0 ? 1 : -1;
  const r0 = sign * (10 + (Math.abs(hash) % 10));
  const r1 = sign * (3 + (Math.abs(hash >> 3) % 4));
  const tx = ((Math.abs(hash >> 6) % 7) - 3) + "px";
  return { r0, r1, tx };
}

function seenKey(userId: string) {
  return `bibliyofili-badges-seen-${userId}`;
}

// Bir kullanıcının rozetlerini "mühür" olarak gösterir. Kazanılanlar bordo
// mürekkeple basılmış gibi, kazanılmamışlar ince gri bir çizgi olarak kalır.
// Daha önce görülmemiş yeni bir rozet kazanılınca bir kereliğine "basılma"
// animasyonuyla beliriyor — hangi rozetlerin görüldüğü tarayıcıda
// (localStorage) tutuluyor, Firestore'a yeni bir alan yazılmıyor.
export default function BadgeList({ userId }: { userId: string }) {
  const badges = useBadges(userId);
  const [justEarned, setJustEarned] = useState<Set<string>>(new Set());
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || badges.length === 0) return;
    seeded.current = true;

    const key = seenKey(userId);
    let seen: string[] | null = null;
    try {
      const raw = localStorage.getItem(key);
      seen = raw ? JSON.parse(raw) : null;
    } catch {
      seen = null;
    }

    const earnedIds = badges.filter((b) => b.earned).map((b) => b.id);

    if (seen === null) {
      // İlk kez görülüyor — o ana kadar zaten kazanılmış rozetleri sessizce
      // "görüldü" say, hepsi birden "yeni kazanıldı" gibi patlamasın.
      try {
        localStorage.setItem(key, JSON.stringify(earnedIds));
      } catch {
        /* localStorage kapalıysa sorun değil, sadece animasyon her ziyarette oynar */
      }
      return;
    }

    const seenSet = new Set(seen);
    const fresh = earnedIds.filter((id) => !seenSet.has(id));
    if (fresh.length > 0) {
      setJustEarned(new Set(fresh));
      try {
        localStorage.setItem(key, JSON.stringify(earnedIds));
      } catch {
        /* yoksay */
      }
    }
  }, [badges, userId]);

  return (
    <div className="badge-seal-grid">
      {/* Tüm mühürlerin paylaştığı mürekkep dokusu, tek seferlik tanım. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <pattern id="badgeInkGrain" patternUnits="userSpaceOnUse" width="26" height="26">
            <image href={`data:image/png;base64,${BADGE_INK_GRAIN_BASE64}`} width="26" height="26" />
          </pattern>
        </defs>
      </svg>

      {badges.map((badge) => {
        const stance = stanceFor(badge.id);
        const stroke = badge.earned ? "url(#badgeInkGrain)" : "currentColor";
        const classes = ["badge-seal"];
        if (badge.earned) classes.push("earned");
        if (justEarned.has(badge.id)) classes.push("stamping");

        return (
          <div
            key={badge.id}
            className={classes.join(" ")}
            title={badge.description}
            style={
              {
                "--r0": `${stance.r0}deg`,
                "--r1": `${stance.r1}deg`,
                "--tx": stance.tx,
              } as CSSProperties
            }
          >
            <svg className="badge-seal-svg" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="38" fill="none" stroke={stroke} strokeWidth="3" />
              <g
                fill="none"
                stroke={stroke}
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(50,50) scale(1.55) translate(-12,-12)"
                dangerouslySetInnerHTML={{ __html: BADGE_ICON_PATHS[badge.icon] ?? "" }}
              />
            </svg>
            <span className="badge-seal-label">{badge.label}</span>
          </div>
        );
      })}
    </div>
  );
}
