import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useMessages } from "../hooks/useMessages";
import { useActivity, hareketMetni } from "../hooks/useActivity";
import type { Activity } from "../hooks/useActivity";
import { usePageTitle } from "../hooks/usePageTitle";
import { ayniGun, gunEtiketi, saatEtiketi } from "../lib/time";
import Avatar from "../components/Avatar";
import type { Message } from "../types";

// Aynı kişinin peş peşe mesajları tek blok sayılır; arada bu kadar zaman
// geçmişse blok yeniden başlar (yoksa sabah 9'daki mesajla akşamki aynı
// künyenin altında görünür).
const BLOK_ARASI = 30 * 60_000;

// Akıştan kaç hareket çekilsin ve peş peşe kaç tanesi gösterilsin.
// Sessiz bir günde hareketler sohbeti boğmasın diye fazlası tek satıra katlanır.
const HAREKET_SAYISI = 40;
const ARKA_ARKAYA_HAREKET = 3;

// Zaman çizgisindeki tek bir satır: ya bir mesaj, ya bir hareket, ya da
// katlanmış hareketleri özetleyen satır.
type Satir =
  | {
      tur: "mesaj";
      key: string;
      yeniGun: boolean;
      at: number;
      blokBasi: boolean;
      mesaj: Message;
    }
  | { tur: "hareket"; key: string; yeniGun: boolean; at: number; hareket: Activity }
  | { tur: "ozet"; key: string; yeniGun: boolean; at: number; adet: number };

// Sohbet odası: sadece onaylı üyeler görür ve yazar.
// Tasarım notu: baloncuk (bubble) yok — baloncuk kutudur, sitenin dili kutusuz.
// Yerine söyleşi/tutanak düzeni: künye satırı + akan metin.
//
// Kulüpte olan bitenler (puan, alıntı, okuma, yeni öneri) ayrı bir kutu ya da
// yan sütun değil, sohbetin İÇİNE kendi zaman sıralarına giriyor: sohbetin
// metaforu tutanak, tutanak konuşulanı da olanı da yazar. Yeni veri yok —
// akış zaten mevcut koleksiyonlardan türetiliyor (bkz. useActivity).
export default function ChatPage() {
  const { currentUser, users, books, isMember, isAdmin, markChatSeen } = useApp();
  const { mesajlar, gonder, sil, yukleniyor } = useMessages();
  const hareketler = useActivity(HAREKET_SAYISI);
  const [taslak, setTaslak] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  usePageTitle("Sohbet");

  // Sayfa açıkken Navbar'daki okunmamış rozeti hep sıfır kalsın: her yeni
  // mesaj/hareket geldiğinde "gördüm" zamanını da ileri alıyoruz.
  useEffect(() => {
    markChatSeen();
  }, [mesajlar.length, hareketler.length]);

  const akisRef = useRef<HTMLDivElement>(null);
  // Kullanıcı en altta mı? Yukarıda geçmişi okuyorsa yeni mesaj gelince
  // yerinden oynatmıyoruz.
  const altta = useRef(true);

  // Mesajlar ve hareketler tek listede, zamana göre eskiden yeniye.
  // Her satır için: yeni gün mü başlıyor, künye (ad/avatar) tekrar yazılacak mı.
  const satirlar = useMemo(() => {
    const ogeler: ({ at: number } & (
      | { mesaj: Message; hareket?: undefined }
      | { hareket: Activity; mesaj?: undefined }
    ))[] = [
      ...mesajlar.map((mesaj) => ({ at: mesaj.createdAt, mesaj })),
      ...hareketler.map((hareket) => ({ at: hareket.at, hareket })),
    ];
    ogeler.sort((a, b) => a.at - b.at);

    const out: Satir[] = [];
    let sonAt: number | null = null;
    let sonMesaj: Message | null = null;
    // Araya hareket satırı giren iki mesaj artık aynı blok sayılmaz; künye
    // yeniden yazılır, yoksa satırlar bir başkasının söylediği gibi görünür.
    let araBozuldu = false;

    const yeniGunMu = (at: number) => sonAt === null || !ayniGun(sonAt, at);

    let i = 0;
    while (i < ogeler.length) {
      const oge = ogeler[i];

      if (oge.mesaj) {
        const yeniGun = yeniGunMu(oge.at);
        const blokBasi =
          yeniGun ||
          araBozuldu ||
          !sonMesaj ||
          sonMesaj.uid !== oge.mesaj.uid ||
          oge.at - sonMesaj.createdAt > BLOK_ARASI;
        out.push({
          tur: "mesaj",
          key: oge.mesaj.id,
          yeniGun,
          at: oge.at,
          blokBasi,
          mesaj: oge.mesaj,
        });
        sonMesaj = oge.mesaj;
        sonAt = oge.at;
        araBozuldu = false;
        i++;
        continue;
      }

      // Peş peşe gelen hareketler: ilk üçü yazılır, kalanı tek satıra katlanır.
      let j = i;
      while (j < ogeler.length && ogeler[j].hareket) j++;
      const seri = ogeler.slice(i, j);

      for (const h of seri.slice(0, ARKA_ARKAYA_HAREKET)) {
        const yeniGun = yeniGunMu(h.at);
        out.push({
          tur: "hareket",
          key: h.hareket!.id,
          yeniGun,
          at: h.at,
          hareket: h.hareket!,
        });
        sonAt = h.at;
      }
      if (seri.length > ARKA_ARKAYA_HAREKET) {
        const son = seri[seri.length - 1];
        out.push({
          tur: "ozet",
          key: `ozet-${son.hareket!.id}`,
          yeniGun: yeniGunMu(son.at),
          at: son.at,
          adet: seri.length - ARKA_ARKAYA_HAREKET,
        });
        sonAt = son.at;
      }
      araBozuldu = true;
      i = j;
    }

    return out;
  }, [mesajlar, hareketler]);

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

        {satirlar.map((satir) => {
          const gun = satir.yeniGun && (
            <div className="chat-gun">{gunEtiketi(satir.at)}</div>
          );

          // Katlanmış hareketler: sessiz bir gün sohbeti doldurmasın.
          if (satir.tur === "ozet") {
            return (
              <Fragment key={satir.key}>
                {gun}
                <p className="chat-hareket chat-hareket-ozet">
                  … ve {satir.adet} hareket daha
                </p>
              </Fragment>
            );
          }

          // Hareket satırı bir sahne notu: avatarsız, künyesiz, tek satır.
          if (satir.tur === "hareket") {
            const a = satir.hareket;
            const kisi = users.find((u) => u.id === a.userId);
            const kitap = books.find((b) => b.id === a.bookId);
            const ad = a.userId === currentUser?.id ? "Sen" : kisi?.name ?? "Üye";
            return (
              <Fragment key={satir.key}>
                {gun}
                <p className="chat-hareket">
                  {ad} {hareketMetni(a, kitap?.pages)}
                  {/* Birleştirilmiş satırda tek bir kitap adı yanıltıcı olur */}
                  {kitap && !(a.count && a.count > 1) && (
                    <>
                      {" · "}
                      <Link to={`/kitap/${kitap.id}`}>{kitap.title}</Link>
                    </>
                  )}
                </p>
              </Fragment>
            );
          }

          const { mesaj, blokBasi } = satir;
          const yazar = users.find((u) => u.id === mesaj.uid);
          const benim = currentUser?.id === mesaj.uid;
          return (
            <Fragment key={satir.key}>
              {gun}
              <div className={blokBasi ? "chat-satir blok-basi" : "chat-satir"}>
                {blokBasi && (
                  <div className="chat-kunye">
                    <Avatar user={yazar ?? { id: mesaj.uid, photo: null }} size={22} />
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
