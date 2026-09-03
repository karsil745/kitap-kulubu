import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useSchedule } from "../hooks/useSchedule";
import { useKatilim } from "../hooks/useKatilim";
import Avatar from "./Avatar";
import {
  bulusmaEtiketi,
  googleTakvimBaglantisi,
  tarihGirdisinden,
  tarihGirdisine,
} from "../lib/time";

// Ayın kitabını ne zaman konuşacağımız. Takvim "hangi ay ne okuyoruz"u
// biliyordu ama "ne zaman buluşuyoruz"u bilmiyordu — kulübün en somut eksiğiydi.
// Zaman schedule/{month} kaydında tutulur; yalnızca yönetici belirler.
export default function Meeting({
  month,
  meetingAt,
  bookTitle,
}: {
  month: string;
  meetingAt?: number | null;
  bookTitle?: string;
}) {
  const { isAdmin, isMember, users } = useApp();
  const { setMeeting } = useSchedule();
  const { benimDurumum, gelenler, isaretle } = useKatilim(month);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    meetingAt ? tarihGirdisine(meetingAt) : ""
  );

  const gecti = meetingAt ? meetingAt < Date.now() : false;

  // Katılım bloğu ancak gösterecek bir şey varsa DOM'a girsin: ziyaretçide
  // (düğme yok) ve kimse işaretlememişken (özet yok) boş bir kutu kalıyordu.
  const katilimButonlari = !gecti && isMember;
  const katilimOzeti = gelenler.length > 0;

  async function kaydet() {
    const ms = tarihGirdisinden(value);
    if (ms === null) return;
    await setMeeting(month, ms);
    setEditing(false);
  }

  async function kaldir() {
    await setMeeting(month, null);
    setEditing(false);
    setValue("");
  }

  if (!meetingAt && !isAdmin) return null;

  return (
    <div className="meeting">
      {meetingAt ? (
        <p className="meeting-line">
          <span className="meeting-label">
            {gecti ? "Buluştuk" : "Buluşma"}
          </span>
          <span className="meeting-when">{bulusmaEtiketi(meetingAt)}</span>
          {!gecti && (
            <a
              className="meeting-add"
              href={googleTakvimBaglantisi({
                baslik: bookTitle
                  ? `Bibliyofili · ${bookTitle}`
                  : "Bibliyofili kitap kulübü",
                baslangic: meetingAt,
                detay: "Bibliyofili Kitap Kulübü buluşması",
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              Takvime ekle →
            </a>
          )}
        </p>
      ) : (
        <p className="meeting-line">
          <span className="meeting-label">Buluşma</span>
          <span className="meeting-when meeting-empty">henüz belirlenmedi</span>
        </p>
      )}

      {/* Katılım işareti: sadece tarih belliyse anlamlı. Gelecekteki buluşmada
          iki hap düğme, geçmişte yalnızca kaç kişi geldiği. "Belki" hâli yok —
          cevap vermemek zaten belki demek. */}
      {meetingAt && (katilimButonlari || katilimOzeti) && (
        <div className="katilim">
          {katilimButonlari && (
            <div className="katilim-butonlar">
              <button
                className={benimDurumum === "geliyor" ? "btn-primary" : "btn-ghost"}
                onClick={() => isaretle("geliyor")}
                aria-pressed={benimDurumum === "geliyor"}
              >
                Geliyorum
              </button>
              <button
                className={benimDurumum === "gelemiyor" ? "btn-primary" : "btn-ghost"}
                onClick={() => isaretle("gelemiyor")}
                aria-pressed={benimDurumum === "gelemiyor"}
              >
                Gelemem
              </button>
            </div>
          )}

          {katilimOzeti && (
            <div className="katilim-ozet">
              <span className="katilim-avatarlar">
                {gelenler.slice(0, 8).map((k) => {
                  const kisi = users.find((u) => u.id === k.userId);
                  return (
                    <Avatar
                      key={k.id}
                      user={kisi ?? { id: k.userId, photo: null }}
                      size={24}
                    />
                  );
                })}
              </span>
              <span className="katilim-sayi">
                {gelenler.length} kişi {gecti ? "geldi" : "geliyor"}
              </span>
            </div>
          )}
        </div>
      )}

      {isAdmin &&
        (editing ? (
          <div className="meeting-edit">
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button className="btn-primary" onClick={kaydet} disabled={!value}>
              Kaydet
            </button>
            <button className="btn-ghost" onClick={() => setEditing(false)}>
              Vazgeç
            </button>
            {meetingAt && (
              <button className="btn-danger" onClick={kaldir}>
                Kaldır
              </button>
            )}
          </div>
        ) : (
          <button className="btn-danger" onClick={() => setEditing(true)}>
            {meetingAt ? "Tarihi değiştir" : "Tarih belirle"}
          </button>
        ))}
    </div>
  );
}
