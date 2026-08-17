import { useEffect, useState } from "react";

// Açık/koyu tema geçişi. Tercih localStorage'da "kk_theme" olarak saklanır.
// İlk tema, sayfa açılmadan index.html'deki küçük betikle uygulanır (yanıp
// sönmeyi önlemek için); bu bileşen sadece geçişi ve kaydı yönetir.
export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(
    () => document.documentElement.dataset.theme === "dark"
  );

  useEffect(() => {
    const theme = dark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kk_theme", theme);
  }, [dark]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      title={dark ? "Açık tema" : "Koyu tema"}
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
