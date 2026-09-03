import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Author, Book, Figure, Review, User } from "../types";
import { auth, db, googleProvider } from "../lib/firebase";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  authors as seedAuthors,
  books as seedBooks,
  users as seedUsers,
} from "../data/mockData";

// Uygulamanın paylaşılan durumu (state) burada tutulur.
// Artık veriler tarayıcı hafızasından değil, Firebase'den (Firestore + Auth) gelir.
interface AppState {
  currentUser: User | null;
  users: User[];
  books: Book[];
  authors: Author[];
  // Tüm değerlendirmeler (kartlarda ortalama yıldız puanını göstermek için)
  reviews: Review[];
  // Giriş yapan kullanıcı yönetici mi?
  isAdmin: boolean;
  // Giriş yapan kullanıcı kulübe kabul edilmiş bir üye mi? Google hesabı olan
  // herkes giriş yapabildiği için "giriş yapmış olmak" yazma yetkisi vermez;
  // yazma gerektiren her yer bunu kullanmalı. Yöneticiler otomatik üyedir.
  isMember: boolean;
  // Google ile giriş açar (popup). Başarılıysa currentUser otomatik dolar.
  login: () => Promise<void>;
  logout: () => void;
  // Bir kullanıcı yeni kitap önerir
  addBook: (
    book: Omit<Book, "id" | "recommendedBy" | "createdAt">
  ) => Promise<void>;
  // Var olan bir kitabı önerenler listesine ekler/çıkarır
  toggleRecommend: (bookId: string) => Promise<void>;
  // Yönetici bir kitabı siler (yanlış/mükerrer kayıtları temizlemek için)
  deleteBook: (bookId: string) => Promise<void>;
  // Yönetici kitap künyesini düzeltir (sayfa sayısı, yıl, ad…)
  updateBook: (bookId: string, patch: Partial<Book>) => Promise<void>;
  // Ada göre yazar bulur; yoksa yeni yazar belgesi oluşturur ve id'sini döndürür
  ensureAuthor: (name: string, era: string) => Promise<string>;
  // Giriş yapan kullanıcının Google fotoğrafını açar/kapatır (emoji yoktu,
  // artık figür var — bkz. setFigure). `null` fotoğrafı kaldırıp figüre döner.
  updateAvatar: (photo: string | null) => Promise<void>;
  // Kullanıcı "Profili özelleştir" ekranında kendi figürünü kaydeder.
  setFigure: (figure: Figure) => Promise<void>;
  // Yönetici bir üyenin kulüp onayını verir/geri alır (users/{uid}.approved).
  setApproved: (userId: string, approved: boolean) => Promise<void>;
  // Sohbet sayfası açıldığında çağrılır; Navbar'daki okunmamış rozetini sıfırlar.
  markChatSeen: () => Promise<void>;
  // Kullanıcı yıllık okuma hedefini belirler/değiştirir (users/{uid}.readingGoal).
  setReadingGoal: (goal: number) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

// Firestore boşsa (ilk çalıştırma) örnek verileri bir kez yükler.
// Böylece uygulama ilk açıldığında boş görünmez.
async function seedIfEmpty() {
  const snap = await getDocs(collection(db, "books"));
  if (!snap.empty) return; // Zaten veri var, dokunma

  // Örnek üyeler (kitapları öneren geçmiş kullanıcılar)
  await Promise.all(seedUsers.map((u) => setDoc(doc(db, "users", u.id), u)));

  // Örnek kitaplar — dizideki sıraya göre azalan createdAt veriyoruz ki
  // ilk kitap en üstte görünsün.
  let t = Date.now();
  await Promise.all(
    seedBooks.map((b) => {
      const { id, ...rest } = b;
      return setDoc(doc(db, "books", id), { ...rest, createdAt: t-- });
    })
  );
}

// Yazarlar için de aynı seed kalıbı — koleksiyon boşsa bir kez örnek yazarları yükler.
async function seedAuthorsIfEmpty() {
  const snap = await getDocs(collection(db, "authors"));
  if (!snap.empty) return; // Zaten veri var, dokunma

  await Promise.all(
    seedAuthors.map((a) => {
      const { id, ...rest } = a;
      return setDoc(doc(db, "authors", id), rest);
    })
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Auth durumu Firebase'den gelene kadar bekleriz (sayfa yenilenince
  // "giriş yapılmamış" gibi anlık yanıp sönmeyi önler).
  const [authReady, setAuthReady] = useState(false);

  // Giriş yapan kullanıcı yönetici mi?
  const isAdmin = currentUser?.role === "admin";
  // Kulübe kabul edilmiş üye mi? (users/{uid}.approved — Console'dan elle verilir)
  const isMember = isAdmin || currentUser?.approved === true;

  // İlk açılışta örnek verileri yükle (sadece Firestore boşsa). Bu bir kerelik
  // kurulum adımı olduğu için yalnızca yönetici girişliyken çalışır: ziyaretçide
  // kurallar yazmayı zaten engelliyordu, boşuna okuma kotası harcanıyordu.
  useEffect(() => {
    if (!isAdmin) return;
    seedIfEmpty().catch((e) => console.error("Seed hatası:", e));
    seedAuthorsIfEmpty().catch((e) => console.error("Yazar seed hatası:", e));
  }, [isAdmin]);

  // Giriş durumunu dinle. Google ile giriş yapılınca burası tetiklenir.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setCurrentUser(null);
        setAuthReady(true);
        return;
      }
      // Kullanıcının profil belgesi var mı? Yoksa ilk girişte oluştur.
      const ref = doc(db, "users", fbUser.uid);
      const profile = await getDoc(ref);
      if (profile.exists()) {
        const data = profile.data();
        // Geriye dönük doldurma: profilde photo alanı hiç yoksa ve Google
        // hesabında bir profil fotoğrafı varsa, tek seferlik olarak yazalım.
        if (data.photo === undefined && fbUser.photoURL) {
          await updateDoc(ref, { photo: fbUser.photoURL });
          data.photo = fbUser.photoURL;
        }
        setCurrentUser({ id: fbUser.uid, ...data } as User);
      } else {
        // `figure` bilerek boş bırakılıyor — Avatar bileşeni kimlikten sabit
        // bir figür türetiyor, kişi Profilim'den isterse kendi seçimini yapar.
        const newUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName ?? "İsimsiz üye",
          photo: fbUser.photoURL ?? null,
          bio: "Yeni üye 👋",
        };
        // Belge adının kendisi id olduğu için id'yi içeride tekrar tutmuyoruz.
        const { id: _omit, ...toStore } = newUser;
        await setDoc(ref, toStore);
        setCurrentUser(newUser);
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Kitapları gerçek zamanlı dinle — biri kitap eklerse/önerirse anında güncellenir.
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "books"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Book));
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // En yeni üstte
        setBooks(list);
      },
      (err) => console.error("Kitaplar dinlenemedi:", err)
    );
    return unsub;
  }, []);

  // Üyeleri gerçek zamanlı dinle (öneren isimlerini göstermek için).
  // Üye listesi gerçek adlar ve profil fotoğrafları içerdiği için kurallarda
  // giriş şartına bağlı; ziyaretçide dinleyiciyi hiç açmıyoruz ki boşuna
  // "permission-denied" hatası basmasın.
  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as User)));
      },
      (err) => console.error("Üyeler dinlenemedi:", err)
    );
    return unsub;
  }, [currentUser]);

  // Yazarları gerçek zamanlı dinle (kitap detaylarında ve yazar sayfasında kullanılır)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "authors"),
      (snap) => {
        setAuthors(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Author))
        );
      },
      (err) => console.error("Yazarlar dinlenemedi:", err)
    );
    return unsub;
  }, []);

  // Tüm değerlendirmeleri gerçek zamanlı dinle — kitap kartlarında ortalama
  // yıldız puanını göstermek için (kart başına ayrı dinleyici açmamak adına).
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "reviews"),
      (snap) => {
        setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
      },
      (err) => console.error("Değerlendirmeler dinlenemedi:", err)
    );
    return unsub;
  }, []);

  // Yönlendirmeli girişten dönüşte sonucu al (hata olursa görünür olsun).
  useEffect(() => {
    getRedirectResult(auth).catch((e) =>
      console.error("Yönlendirme girişi hatası:", e)
    );
  }, []);

  // Google ile giriş: önce popup (pencere) dener. Popup, oturum bilgisini
  // opener'a doğrudan aktardığı için farklı alan adları arasındaki depolama
  // engeline takılmaz — yönlendirmenin "dönünce giriş olmuyor" sorununu aşar.
  // Popup engellenirse (bazı mobil/uygulama içi tarayıcılar) yönlendirmeye düşer.
  async function login() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw e;
    }
  }

  function logout() {
    signOut(auth);
  }

  async function addBook(
    book: Omit<Book, "id" | "recommendedBy" | "createdAt">
  ) {
    if (!currentUser || !isMember) return;
    // Firestore `undefined` değer kabul etmez, yazma tümden hata verir. Yıl,
    // kapak ve sayfa sayısı isteğe bağlı olduğu için (aramadan seçmeden elle
    // kitap eklenince boş kalıyorlar) tanımsız alanları burada eliyoruz.
    const temiz = Object.fromEntries(
      Object.entries(book).filter(([, v]) => v !== undefined)
    );
    await addDoc(collection(db, "books"), {
      ...temiz,
      recommendedBy: [currentUser.id],
      createdAt: Date.now(),
    });
  }

  async function toggleRecommend(bookId: string) {
    if (!currentUser || !isMember) return;
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    const has = book.recommendedBy.includes(currentUser.id);
    await updateDoc(doc(db, "books", bookId), {
      recommendedBy: has
        ? arrayRemove(currentUser.id)
        : arrayUnion(currentUser.id),
    });
  }

  // Kitabı siler. Sadece yönetici — arama sonucundan yanlış/mükerrer eklenen
  // kayıtları (aynı kitabın üç farklı yazımı gibi) temizlemek için.
  // Not: Firestore kuralları da bunu isAdmin() ile ayrıca zorunlu kılar.
  async function deleteBook(bookId: string) {
    if (!isAdmin) return;

    // Önce kitaba bağlı kayıtları temizle: yorum, alıntı, raf ve oy. Kitap
    // silinip bunlar bırakılırsa geride hiçbir yerde görünmeyen ama puan
    // ortalamasını ve rozet sayımlarını etkileyebilen yetim kayıtlar kalır.
    const linked = ["reviews", "quotes", "shelves", "votes"];
    for (const name of linked) {
      const snap = await getDocs(
        query(collection(db, name), where("bookId", "==", bookId))
      );
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    }

    await deleteDoc(doc(db, "books", bookId));
  }

  // Kitap künyesini düzeltir. Sadece yönetici — kurallarda sıradan üye
  // yalnızca recommendedBy alanına dokunabiliyor.
  async function updateBook(bookId: string, patch: Partial<Book>) {
    if (!isAdmin) return;
    await updateDoc(doc(db, "books", bookId), patch);
  }

  // Ada göre yazar arar (küçük harf, boşluksuz karşılaştırma); yoksa yeni
  // yazar belgesi oluşturur (auto-id) ve id'sini döndürür.
  async function ensureAuthor(name: string, era: string): Promise<string> {
    if (!isMember) throw new Error("Yazar eklemek için onaylı üye olmalısın");
    const cleanName = name.trim() || "Bilinmeyen";
    const existing = authors.find(
      (a) => a.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) return existing.id;

    const ref = await addDoc(collection(db, "authors"), {
      name: cleanName,
      era,
      bio: "",
    });
    return ref.id;
  }

  // Google fotoğrafını açar (photoURL) ya da kapatır (null) — kapatınca
  // Avatar bileşeni otomatik olarak figüre döner.
  async function updateAvatar(photo: string | null) {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.id), { photo });
    // currentUser gerçek zamanlı dinlenmediği için değişikliği burada da
    // yansıtıyoruz (iyimser güncelleme) — sayfa yenilenmeden anında görünsün.
    setCurrentUser((prev) => (prev ? { ...prev, photo } : prev));
  }

  // "Profili özelleştir" ekranındaki seçimleri kaydeder.
  async function setFigure(figure: Figure) {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.id), { figure });
    setCurrentUser((prev) => (prev ? { ...prev, figure } : prev));
  }

  // Üyelik onayı: yönetici Profil sayfasındaki listeden verir. Daha önce bu
  // alan sadece Firebase Console'dan elle giriliyordu; her yeni üye için
  // Console'a girmek sürdürülebilir değildi. Kurallar bu yazının yalnızca
  // yöneticiden gelmesini ve SADECE `approved` alanına dokunmasını zorunlu
  // kılıyor — `role` hâlâ elle veriliyor.
  async function setApproved(userId: string, approved: boolean) {
    if (!isAdmin) return;
    // Kendi onayını kaldırıp kendini kilitlemeni engelle.
    if (userId === currentUser?.id) return;
    await updateDoc(doc(db, "users", userId), { approved });
  }

  // Sohbet sayfası her açıldığında/güncellendiğinde çağrılır, "son görülme"
  // zamanını şimdiye çeker. updateAvatar'daki gibi iyimser güncelleme
  // yapıyoruz ki rozet Firestore'un cevabını beklemeden hemen sıfırlansın.
  async function markChatSeen() {
    if (!currentUser) return;
    const now = Date.now();
    setCurrentUser((prev) => (prev ? { ...prev, chatSeenAt: now } : prev));
    await updateDoc(doc(db, "users", currentUser.id), { chatSeenAt: now });
  }

  // Yıllık okuma hedefini yazar. Sıfır/negatif ya da tam sayı olmayan
  // değerleri sessizce yok sayıyoruz — çağıran taraf (ReadingGoal) zaten
  // bunu doğruluyor ama kural da aynısını zorunlu kılıyor.
  async function setReadingGoal(goal: number) {
    if (!currentUser || !Number.isInteger(goal) || goal <= 0) return;
    setCurrentUser((prev) => (prev ? { ...prev, readingGoal: goal } : prev));
    await updateDoc(doc(db, "users", currentUser.id), { readingGoal: goal });
  }

  // Firebase'den giriş durumu gelene kadar kısa bir yükleniyor ekranı
  if (!authReady) {
    return <div className="section loading">Yükleniyor…</div>;
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        books,
        authors,
        reviews,
        isAdmin,
        isMember,
        login,
        logout,
        addBook,
        toggleRecommend,
        deleteBook,
        updateBook,
        ensureAuthor,
        updateAvatar,
        setFigure,
        setApproved,
        markChatSeen,
        setReadingGoal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Sayfaların bu durumu kolayca kullanması için özel bir hook
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp, AppProvider içinde kullanılmalı");
  return ctx;
}
