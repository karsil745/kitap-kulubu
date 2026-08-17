import { useBadges } from "../hooks/useBadges";

// Bir kullanıcının rozetlerini gösterir. Kazanılanlar tam renkli,
// kazanılmamışlar soluk görünür (fareyle üzerine gelince açıklama çıkar).
export default function BadgeList({ userId }: { userId: string }) {
  const badges = useBadges(userId);

  return (
    <div className="badge-grid">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={badge.earned ? "badge-item earned" : "badge-item"}
          title={badge.description}
        >
          <span className="badge-icon">{badge.icon}</span>
          <span className="badge-label">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
