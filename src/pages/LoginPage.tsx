import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";

// Instagram/Facebook/WhatsApp gibi uygulamaların kendi içindeki tarayıcılar
// Google giriş popup'ını engelliyor ve dönüşte oturum kurulmuyor. Bu durumda
// kullanıcıya sayfayı gerçek tarayıcıda açmasını söylemek gerekiyor.
function isInAppBrowser(): boolean {
  const ua = navigator.userAgent;
  return /FBAN|FBAV|Instagram|Line|WhatsApp|Snapchat|Twitter|MicroMessenger/i.test(ua);
}

// Google ile giriş. Firebase Auth popup'ı açar; başarılı olunca profile gider.
export default function LoginPage() {
  const { login, currentUser } = useApp();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle("Kulübe Giriş");

  // Giriş bağlantısını veren sayfa kendi yolunu `state.from` ile geçiriyor;
  // giriş bitince kullanıcı ne yapmak istiyorsa oraya döner. Eskiden herkes
  // profile düşüyor, oy vermeye gelen kişi niyetini kendisi hatırlıyordu.
  const donusYolu = (location.state as { from?: string } | null)?.from ?? "/profil";

  // Zaten giriş yapılmışsa (render sırasında yönlendirme yapmak yerine
  // Navigate bileşeniyle — React uyarısı vermez).
  if (currentUser) {
    return <Navigate to={donusYolu} replace />;
  }

  async function handleGoogle() {
    setError("");
    setBusy(true);
    try {
      await login();
      navigate(donusYolu, { replace: true });
    } catch (e) {
      // Kullanıcı popup'ı kapattıysa sessizce geç; diğer hataları göster.
      const code = (e as { code?: string })?.code ?? "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError("Giriş yapılamadı. Lütfen tekrar dene.");
        console.error(e);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="section login">
      {/* Aynı gerekçe: sayfa h2 ile açılıyordu, tek h1'i yoktu. */}
      <h1 className="page-baslik-kompakt">Kulübe giriş</h1>
      <p className="hint">
        Google hesabınla giriş yap; kitap önerilerin ve profilin sana özel
        olarak saklanır.
      </p>
      {/* Onay koşulu girişten SONRA öğrenilmesin: Google hesabını verdikten
          sonra "hiçbir şey yapamıyorum" sürprizi sitenin en büyük beklenti
          uyuşmazlığıydı. Aynı metin girişten sonra banner'da da duruyor. */}
      <p className="hint">
        Oy vermek, kitap önermek ve yorum yazmak için kulüp yöneticisinin
        onayı gerekiyor. Onaya kadar sitedeki her şeyi okuyabilirsin.
      </p>

      {isInAppBrowser() && (
        <p className="hint login-warning">
          Bu sayfayı Instagram/WhatsApp gibi bir uygulamanın içinden açtın —
          Google girişi burada çalışmıyor. Sağ üstteki menüden{" "}
          <strong>“Tarayıcıda aç”</strong> deyip Chrome ya da Safari'de tekrar
          dene.
        </p>
      )}

      <button className="btn-primary" onClick={handleGoogle} disabled={busy}>
        {busy ? "Giriş yapılıyor…" : "Google ile Giriş Yap"}
      </button>

      {error && <p className="hint error">{error}</p>}
    </div>
  );
}
