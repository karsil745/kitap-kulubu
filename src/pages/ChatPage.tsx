import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useMessages } from "../hooks/useMessages";
import { usePageTitle } from "../hooks/usePageTitle";
import { ayniGun, gunEtiketi, saatEtiketi } from "../lib/time";
import Avatar from "../components/Avatar";

// Aynı kişinin peş peşe mesajları tek blok sayılır; arada bu kadar zaman
// geçmişse blok yeniden başlar (yoksa sabah 9'daki mesajla akşamki aynı
// künyenin altında görünür).
const BLOK_ARASI = 30 * 60_000;

// Sohbet odası: sadece onaylı üyeler görür ve yazar.
// Tasarım notu: baloncuk (bubble) yok — baloncuk kutudur, sitenin dili kutusuz.
// Yerine söyleşi/tutanak düzeni: künye satırı + akan metin.
export default function ChatPage() {
  const { currentUser, users, isMember, isAdmin } = useApp();
  const { mesajlar, gonder, sil, yukleniyor } = useMessages();
  const [taslak, setTaslak] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  usePageTitle("Sohbet");

  const akisRef = useRef<HTMLDivElement>(null);
  // Kullanıcı en altta mı? Yukarıda geçmişi okuyorsa yeni mesaj gelince
  // yerinden oynatmıyoruz.
  const altta = useRef(true);

  // Her mesaj için: yeni gün mü başlıyor, künye (ad/avatar) tekrar yazılacak mı.
  const satirlar = useMemo(
    () =>
      mesajlar.map((mesaj, i) => {
        const onceki = i > 0 ? mesajlar[i - 1] : null;
        const yeniGun = !onceki || !ayniGun(onceki.createdAt, mesaj.createdAt);
        const blokBasi =
          yeniGun ||
          !onceki ||
          onceki.uid !== mesaj.uid ||
          mesaj.createdAt - onceki.createdAt > BLOK_ARASI;
        return { mesaj, yeniGun, blokBasi };
      }),
    [mesajlar]
  );

  // Açılışta ve yeni mesajda en alta in — ama sadece kullanıcı zaten alttaysa.
  useLayoutEffect(() => {
    const el = akisRef.current;
    if (!el || !altta.current) return;
    el.scrollTop = el.scrollHeight;
  }, [satirlar]);

  function handleScroll() {
    const el = akisRef.current;
    if (!el) return;
    // Birkaç piksellik pay: tarayıcılar kesirli scrollTop üretebiliyor.
    altta.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!taslak.trim() || gonderiliyor) return;
    setGonderiliyor(true);
    try {
      altta.current = true; // Kendi mesajını her hâlükârda gör
      await gonder(taslak);
      setTaslak("");
    } finally {
      setGonderiliyor(false);
    }
  }

  // Enter gönderir, Shift+Enter alt satır. IME ile yazarken (Japonca/Korece
  // aday seçimi) Enter'ı yutmuyoruz.
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    void handleSubmit();
  }

  // Giriş alanı tek satır başlar, yazdıkça birkaç satıra kadar büyür.
  function boyutlaAyarla(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  if (!isMember) {
    return (
      <div>
        <div className="section-head">
          <h1>Sohbet</h1>
        </div>
        <p className="empty">
          {currentUser
            ? "Sohbete katılabilmek için üyeliğinin onaylanması gerekiyor."
            : "Sohbet kulüp üyelerine özel."}
        </p>
        {!currentUser && (
          <p className="hint">
            <Link to="/giris">Giriş yap</Link> ve onay bekle.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="chat-sayfa">
      <div className="section-head">
        <h1>Sohbet</h1>
        <span className="hint">son 100 mesaj</span>
      </div>

      <div className="chat-akis" ref={akisRef} onScroll={handleScroll}>
        {yukleniyor && <p className="empty">Mesajlar yükleniyor…</p>}
        {!yukleniyor && satirlar.length === 0 && (
          <p className="empty">Henüz kimse bir şey yazmamış. İlk sözü sen söyle.</p>
        )}

        {satirlar.map(({ mesaj, yeniGun, blokBasi }) => {
          const yazar = users.find((u) => u.id === mesaj.uid);
          const benim = currentUser?.id === mesaj.uid;
          return (
            <Fragment key={mesaj.id}>
              {yeniGun && <div className="chat-gun">{gunEtiketi(mesaj.createdAt)}</div>}
              <div className={blokBasi ? "chat-satir blok-basi" : "chat-satir"}>
                {blokBasi && (
                  <div className="chat-kunye">
                    <Avatar user={yazar ?? { avatar: "👤", photo: null }} size={22} />
                    <span className={benim ? "chat-ad benim" : "chat-ad"}>
                      {yazar?.name ?? "Bilinmeyen üye"}
                    </span>
                    <span className="chat-saat">{saatEtiketi(mesaj.createdAt)}</span>
                  </div>
                )}
                <div className="chat-govde">
                  <p className="chat-metin">{mesaj.metin}</p>
                  {(benim || isAdmin) && (
                    <button
                      type="button"
                      className="chat-sil"
                      aria-label="Mesajı sil"
                      onClick={() => sil(mesaj.id)}
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      <form className="chat-giris" onSubmit={handleSubmit}>
        <textarea
          rows={1}
          value={taslak}
          maxLength={2000}
          placeholder="Bir şeyler yaz…"
          onChange={(e) => {
            setTaslak(e.target.value);
            boyutlaAyarla(e.target);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn-primary"
          type="submit"
          disabled={gonderiliyor || !taslak.trim()}
        >
          Gönder
        </button>
      </form>
    </div>
  );
}
