import type { Book } from "../types";
import Cover from "./Cover";

interface VoteTallyProps {
  tally: { bookId: string; count: number }[];
  books: Book[];
  leaderId: string | null;
  totalVotes: number;
}

// Canlı oylama sonuçlarını çubuk grafik olarak gösterir.
// Lider olan kitap vurgulanır.
export default function VoteTally({ tally, books, leaderId, totalVotes }: VoteTallyProps) {
  if (tally.length === 0) {
    return <p className="empty">Henüz oy verilmedi.</p>;
  }

  return (
    <div className="vote-tally">
      {tally.map(({ bookId, count }) => {
        const book = books.find((b) => b.id === bookId);
        if (!book) return null;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isLeader = bookId === leaderId;

        return (
          <div
            key={bookId}
            className={`vote-tally-row${isLeader ? " vote-tally-row-leader" : ""}`}
          >
            <div className="vote-tally-cover">
              <Cover book={book} className="cover-emoji" />
            </div>
            <div className="vote-tally-info">
              <div className="vote-tally-head">
                <span className="vote-tally-title">
                  {isLeader && "👑 "}
                  {book.title}
                </span>
                <span className="vote-tally-count">{count} oy</span>
              </div>
              <div className="vote-tally-bar-track">
                <div className="vote-tally-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
