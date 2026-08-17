import { Routes, Route } from "react-router-dom";
import { useApp } from "./context/AppContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import BooksPage from "./pages/BooksPage";
import BookDetailPage from "./pages/BookDetailPage";
import AuthorPage from "./pages/AuthorPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import VotePage from "./pages/VotePage";
import CalendarPage from "./pages/CalendarPage";
import ChatPage from "./pages/ChatPage";
import "./App.css";

// Google hesabı olan herkes giriş yapabiliyor; yazma yetkisi ise yöneticinin
// Firebase Console'dan verdiği `approved` alanına bağlı. Onay bekleyen kişi
// boş boş "neden çalışmıyor" demesin diye durumu açıkça yazıyoruz.
function PendingApprovalBanner() {
  const { currentUser, isMember } = useApp();
  if (!currentUser || isMember) return null;
  return (
    <div className="cta-banner">
      Hoş geldin {currentUser.name} 👋 Üyeliğin kulüp yöneticisinin onayını
      bekliyor. O zamana kadar her şeyi okuyabilirsin, ama oy veremez; kitap,
      yorum ve alıntı ekleyemezsin.
    </div>
  );
}

// Uygulamanın ana çatısı: üst menü + hangi adreste hangi sayfanın gösterileceği.
export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <PendingApprovalBanner />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kitaplar" element={<BooksPage />} />
          <Route path="/kitap/:id" element={<BookDetailPage />} />
          <Route path="/yazar/:id" element={<AuthorPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/oylama" element={<VotePage />} />
          <Route path="/takvim" element={<CalendarPage />} />
          <Route path="/sohbet" element={<ChatPage />} />
        </Routes>
      </main>
      <footer className="footer">
        Bibliyofili Kitap Kulübü · arkadaşlarla okuma keyfi
      </footer>
    </div>
  );
}
