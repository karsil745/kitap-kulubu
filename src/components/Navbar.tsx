import { Link, NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";

// Menü bağlantıları tek yerde: üstte (masaüstü) ve altta (mobil) aynı liste.
const LINKS = [
  { to: "/", label: "Ana Sayfa", end: true },
  { to: "/kitaplar", label: "Kitaplar" },
  { to: "/takvim", label: "Takvim" },
  { to: "/oylama", label: "Oylama" },
];

// Üst menü: her sayfada görünür, sayfalar arası geçişi sağlar.
// Mobilde bağlantılar üstten alınıp alt sekme çubuğuna taşınır — üst menü
// dar ekranda üç satıra sarıp ekranın beşte birini yiyordu.
export default function Navbar() {
  const { currentUser, isMember, logout } = useApp();

  // Sohbet yalnızca onaylı üyeye görünür — kurallarda okuma da isMember()
  // şartına bağlı, onaysız kişiye bağlantı göstermek boşuna hayal kırıklığı.
  const links = [
    ...LINKS,
    ...(isMember ? [{ to: "/sohbet", label: "Sohbet" }] : []),
    ...(currentUser ? [{ to: "/profil", label: "Profil" }] : []),
  ];

  return (
    <>
    <header className="navbar">
      <Link to="/" className="brand">
        <svg
          className="brand-mark"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M24 14 C 18 10, 11 10, 6 12 L 6 37 C 12 35, 18 36, 24 39" />
          <path d="M24 14 C 30 10, 37 10, 42 12 L 42 37 C 36 35, 30 36, 24 39" />
          <path d="M24 14 L 24 39" />
        </svg>
        <span className="brand-lockup">
          <span className="brand-name">Bibliyofili</span>
          <span className="brand-tagline">kitap kulübü</span>
        </span>
      </Link>

      <nav className="nav-links">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="nav-user">
        <ThemeToggle />
        {currentUser ? (
          <>
            <span className="user-chip">
              <Avatar user={currentUser} size={26} />
              {/* Dar ekranda üst satır tek satırda kalsın diye ad gizlenir */}
              <span className="user-chip-name">{currentUser.name}</span>
            </span>
            <button className="btn-ghost" onClick={logout}>
              Çıkış
            </button>
          </>
        ) : (
          <Link to="/giris" className="btn-primary">
            Giriş Yap
          </Link>
        )}
      </div>
    </header>

    {/* Mobil alt sekme çubuğu — masaüstünde gizli (bkz. App.css) */}
    <nav className="tabbar" aria-label="Ana menü">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end}>
          {l.label}
        </NavLink>
      ))}
    </nav>
    </>
  );
}
