import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useActivity } from "../hooks/useActivity";
import type { Activity } from "../hooks/useActivity";
import { zamanOnce } from "../lib/time";
import Avatar from "./Avatar";

// Kulüpte olan biten: puanlar, alıntılar, okuma ilerlemesi ve yeni öneriler
// tek bir zaman sıralı akışta. Ayrı bir koleksiyon yok — hepsi mevcut
// verilerden türetiliyor (bkz. useActivity).

// Eylemi kısa bir ifadeyle anlatır. Kitap adı ayrı bir öge olarak
// gösterildiği için Türkçe ek almasına gerek kalmıyor ("1984'ı" gibi
// yanlış çekimlerden böyle kaçınıyoruz).
function eylem(a: Activity, sayfa?: number): string {
  switch (a.kind) {
    case "review":
      return `★${a.value} verdi`;
    case "quote":
      return "alıntı ekledi";
    case "finished":
      return "bitirdi";
    case "reading":
      if (!a.value) return "okumaya başladı";
      return sayfa
        ? `okuyor · s. ${Math.round((a.value / 100) * sayfa)}`
        : `okuyor · %${a.value}`;
    case "added":
      return a.count && a.count > 1 ? `${a.count} kitap önerdi` : "önerdi";
    default:
      return "";
  }
}

export default function ActivityFeed() {
  const { users, books, currentUser } = useApp();
  const activity = useActivity(10);

  if (activity.length === 0) return null;

  return (
    <section className="activity">
      <div className="section-head">
        <h2>Kulüpte neler oluyor</h2>
      </div>
      <ul className="activity-rows">
        {activity.map((a) => {
          const user = users.find((u) => u.id === a.userId);
          const book = books.find((b) => b.id === a.bookId);
          if (!book) return null; // Silinmiş kitaba ait kayıt
          const isMe = a.userId === currentUser?.id;
          return (
            <li className="activity-row" key={a.id}>
              <span className="activity-who">
                <Avatar user={user ?? { avatar: "👤", photo: null }} size={22} />
                {isMe ? "Sen" : user?.name ?? "Üye"}
              </span>
              <span className="activity-verb">{eylem(a, book.pages)}</span>
              {/* Birleştirilmiş satırda tek bir kitap adı yanıltıcı olur */}
              {!(a.count && a.count > 1) && (
                <Link to={`/kitap/${book.id}`} className="activity-book">
                  {book.title}
                </Link>
              )}
              <span className="activity-time">{zamanOnce(a.at)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
