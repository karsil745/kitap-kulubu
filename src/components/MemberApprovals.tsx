import { useState } from "react";
import { useApp } from "../context/AppContext";
import Avatar from "./Avatar";

// Yönetici-özel: kulübe girmeye çalışan kişilerin onay listesi.
// Google girişi herkese açık olduğu için giriş yapan herkesin users belgesi
// oluşur ama yazma yetkisi `approved: true` ile gelir. Bu alan eskiden sadece
// Firebase Console'dan elle giriliyordu; her yeni üye için Console'a girmek
// gerekiyordu. Artık yönetici buradan tek tıkla onaylıyor.
export default function MemberApprovals() {
  const { users, currentUser, isAdmin, setApproved } = useApp();
  // Hangi satırda işlem sürüyor — çift tıklamayı ve "oldu mu?" belirsizliğini önler
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) return null;

  // Yöneticiler zaten otomatik üye; kendini de listede gösterme.
  const others = users.filter(
    (u) => u.id !== currentUser?.id && u.role !== "admin"
  );
  const pending = others.filter((u) => u.approved !== true);
  const approved = others.filter((u) => u.approved === true);

  async function toggle(userId: string, next: boolean) {
    setBusy(userId);
    setError(null);
    try {
      await setApproved(userId, next);
    } catch (e) {
      // En olası sebep: yeni firestore.rules henüz Console'a yayınlanmadı.
      console.error("Onay değiştirilemedi:", e);
      setError(
        "Yazılamadı. firestore.rules dosyasının güncel hâli Firebase Console'a yayınlandı mı?"
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="section-head">
        <h2>Üyelik onayları</h2>
        {pending.length > 0 && (
          <span className="link-more">{pending.length} bekliyor</span>
        )}
      </div>

      {error && <p className="hint error">{error}</p>}

      {pending.length === 0 ? (
        <p className="empty">Onay bekleyen kimse yok.</p>
      ) : (
        <ul className="approval-rows">
          {pending.map((u) => (
            <li key={u.id} className="approval-row">
              <Avatar user={u} size={30} />
              <span className="approval-name">{u.name}</span>
              <button
                className="btn-primary"
                disabled={busy === u.id}
                onClick={() => toggle(u.id, true)}
              >
                {busy === u.id ? "Onaylanıyor…" : "Onayla"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {approved.length > 0 && (
        <>
          <p className="label approval-group-label">Onaylı üyeler</p>
          <ul className="approval-rows">
            {approved.map((u) => (
              <li key={u.id} className="approval-row">
                <Avatar user={u} size={30} />
                <span className="approval-name">{u.name}</span>
                <button
                  className="btn-danger"
                  disabled={busy === u.id}
                  onClick={() => toggle(u.id, false)}
                >
                  {busy === u.id ? "…" : "Onayı kaldır"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
