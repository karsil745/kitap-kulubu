import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useDiscussion } from "../hooks/useDiscussion";
import type { Answer, Question } from "../types";
import Avatar from "./Avatar";

// Ayın kitabı için tartışma soruları. Herkes aynı sorulara kendi cevabını
// yazar; kimsenin sohbeti başlatması ya da birine cevap vermesi gerekmiyor.
export default function Discussion({ bookId }: { bookId: string }) {
  const { currentUser, isAdmin } = useApp();
  const d = useDiscussion(bookId);
  const [yeniSoru, setYeniSoru] = useState("");

  // Soru yoksa ve yönetici de değilsen bölüm hiç görünmesin.
  if (d.questions.length === 0 && !isAdmin) return null;

  return (
    <section className="discussion">
      <h2>Tartışma</h2>

      {d.questions.length === 0 ? (
        <p className="empty">
          Henüz soru yok. Ayın kitabı için birkaç soru ekle, herkes kendi
          cevabını yazsın.
        </p>
      ) : (
        <ol className="question-list">
          {d.questions.map((q, i) => (
            <QuestionRow
              key={q.id}
              question={q}
              index={i + 1}
              answers={d.answersFor(q.id)}
              mine={d.myAnswer(q.id)}
              onSave={(t) => d.saveAnswer(q.id, t)}
              onRemoveAnswer={() => d.removeAnswer(q.id)}
              onEditQuestion={(t) => d.updateQuestion(q.id, t)}
              onRemoveQuestion={() => d.removeQuestion(q.id)}
            />
          ))}
        </ol>
      )}

      {!currentUser && d.questions.length > 0 && (
        <p className="hint">Cevap yazmak ve diğer cevapları görmek için giriş yap.</p>
      )}

      {isAdmin && (
        <form
          className="question-add"
          onSubmit={async (e) => {
            e.preventDefault();
            await d.addQuestion(yeniSoru);
            setYeniSoru("");
          }}
        >
          <input
            placeholder="Yeni tartışma sorusu"
            value={yeniSoru}
            maxLength={500}
            onChange={(e) => setYeniSoru(e.target.value)}
          />
          <button className="btn-ghost" type="submit" disabled={!yeniSoru.trim()}>
            Soru ekle
          </button>
        </form>
      )}
    </section>
  );
}

function QuestionRow({
  question,
  index,
  answers,
  mine,
  onSave,
  onRemoveAnswer,
  onEditQuestion,
  onRemoveQuestion,
}: {
  question: Question;
  index: number;
  answers: Answer[];
  mine: Answer | null;
  onSave: (text: string) => Promise<void>;
  onRemoveAnswer: () => Promise<void>;
  onEditQuestion: (text: string) => Promise<void>;
  onRemoveQuestion: () => Promise<void>;
}) {
  const { users, currentUser, isMember, isAdmin } = useApp();
  const [text, setText] = useState(mine?.text ?? "");
  const [saving, setSaving] = useState(false);
  // Cevap Firestore'dan sonradan gelir; useState'in başlangıç değeri bir daha
  // çalışmadığı için kutu boş kalırdı (yorum formunda yaşadığımız hata).
  const [loadedId, setLoadedId] = useState<string | null>(mine?.id ?? null);
  useEffect(() => {
    if (mine && mine.id !== loadedId) {
      setText(mine.text);
      setLoadedId(mine.id);
    } else if (!mine && loadedId) {
      setText("");
      setLoadedId(null);
    }
  }, [mine, loadedId]);

  const digerleri = answers.filter((a) => a.userId !== currentUser?.id);
  const degisti = text.trim() !== (mine?.text ?? "");

  return (
    <li className="question">
      <div className="question-head">
        <span className="question-index">{String(index).padStart(2, "0")}</span>
        <p className="question-text">{question.text}</p>
        {isAdmin && (
          <span className="question-admin">
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                const yeni = window.prompt("Soruyu düzenle", question.text);
                if (yeni && yeni.trim()) onEditQuestion(yeni);
              }}
            >
              Düzenle
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                if (
                  window.confirm(
                    "Bu soru ve ona verilmiş tüm cevaplar silinsin mi?"
                  )
                )
                  onRemoveQuestion();
              }}
            >
              Sil
            </button>
          </span>
        )}
      </div>

      {isMember && (
        <div className="answer-form">
          <textarea
            placeholder="Sen ne düşünüyorsun?"
            value={text}
            maxLength={2000}
            rows={3}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="answer-form-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={saving || !text.trim() || !degisti}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(text);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {mine ? "Güncelle" : "Cevapla"}
            </button>
            {mine && (
              <button
                type="button"
                className="btn-danger"
                onClick={onRemoveAnswer}
              >
                Sil
              </button>
            )}
          </div>
        </div>
      )}

      {digerleri.length > 0 && (
        <ul className="answer-list">
          {digerleri.map((a) => {
            const user = users.find((u) => u.id === a.userId);
            return (
              <li className="answer" key={a.id}>
                <span className="answer-who">
                  <Avatar user={user ?? { avatar: "👤", photo: null }} size={20} />
                  {user?.name ?? "Üye"}
                </span>
                <p className="answer-text">{a.text}</p>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
