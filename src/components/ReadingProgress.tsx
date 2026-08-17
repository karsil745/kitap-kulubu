import { useApp } from "../context/AppContext";
import { useBookShelves } from "../hooks/useShelves";
import Avatar from "./Avatar";
import type { ShelfStatus } from "../types";

// "Kulüp nerede": bu kitabı rafına almış üyelerin okuma durumu tek bakışta.
// Ay ortasında herkesin nerede olduğunu görmek kulübün en bağlayıcı kısmı.
// Sıra: okuyanlar (ilerlemesi çok olan üstte) → bitirenler → okumak isteyenler.
const ORDER: Record<ShelfStatus, number> = { reading: 0, read: 1, want: 2 };

export default function ReadingProgress({ bookId }: { bookId: string }) {
  const { users, currentUser, books } = useApp();
  const shelves = useBookShelves(bookId);
  // Sayfa sayısı biliniyorsa yüzde yerine sayfayı gösteriyoruz.
  const toplamSayfa = books.find((b) => b.id === bookId)?.pages;

  // Ziyaretçide raflar okunamıyor; boşken de bölümü hiç göstermiyoruz.
  if (!currentUser || shelves.length === 0) return null;

  const rows = [...shelves].sort((a, b) => {
    const byStatus = ORDER[a.status] - ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    return (b.progress ?? 0) - (a.progress ?? 0);
  });

  // Tek bakışta özet — kim kim olduğuna bakmadan kulübün nerede olduğu.
  // Sıfır olan durumu hiç yazmıyoruz ("0 bitirdi" gürültü).
  const say = (s: ShelfStatus) => shelves.filter((x) => x.status === s).length;
  const ozet = [
    say("reading") && `${say("reading")} okuyor`,
    say("read") && `${say("read")} bitirdi`,
    say("want") && `${say("want")} istiyor`,
  ].filter(Boolean) as string[];

  return (
    <section className="reading-progress">
      <h2>Kulüp nerede</h2>
      <p className="progress-summary">{ozet.join(" · ")}</p>
      <ul className="progress-rows">
        {rows.map((shelf) => {
          const user = users.find((u) => u.id === shelf.userId);
          const pct = shelf.progress ?? 0;
          const isMe = shelf.userId === currentUser.id;
          return (
            <li className="progress-row" key={shelf.id}>
              <span className="progress-who">
                <Avatar user={user ?? { avatar: "👤", photo: null }} size={22} />
                {isMe ? "Sen" : user?.name ?? "Üye"}
              </span>

              {shelf.status === "reading" ? (
                <>
                  <span className="progress-track" aria-hidden="true">
                    <span
                      className="progress-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="progress-value">
                    {toplamSayfa
                      ? `s. ${Math.round((pct / 100) * toplamSayfa)}`
                      : `%${pct}`}
                  </span>
                </>
              ) : (
                <span className="progress-state">
                  {shelf.status === "read" ? "bitirdi" : "okumak istiyor"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
