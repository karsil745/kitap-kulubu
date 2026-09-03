// Uygulamadaki tüm veri tiplerini burada tanımlıyoruz.
// TypeScript sayesinde her verinin şekli baştan bellidir; bu da hataları azaltır.

export interface Author {
  id: string;
  name: string;
  birthYear?: number;
  deathYear?: number;
  bio: string; // Kısa yazar tanıtımı
  era?: string; // Yazarın dönemi/akımı
}

export interface Book {
  id: string;
  title: string;
  authorId: string;
  era: string; // Dönem/akım, örn. "Victoria Dönemi"
  year?: number;
  // Sayfa sayısı (Open Library'den gelir, elle de düzeltilebilir). Varsa okuma
  // ilerlemesi yüzde yerine sayfa üzerinden girilir — kimse "%35'teyim" demez.
  pages?: number;
  cover: string; // Kapak resmi yoksa gösterilecek emoji (yedek)
  coverImage?: string; // Gerçek kapak fotoğrafının URL'si (varsa öncelikli)
  description: string;
  // Bu kitabı öneren kullanıcıların id'leri
  recommendedBy: string[];
  // Firestore'a eklenme zamanı (ms). En yeniyi üste sıralamak için kullanılır.
  createdAt?: number;
}

// Kullanıcının kendi "giydirdiği" figürü (DiceBear "Critters" stili).
// Resim hiç saklanmıyor — bu 5 seçim her yerde anlık olarak bir SVG'ye
// çevriliyor (bkz. src/lib/figure.ts). Kimse figürünü seçmediyse bile
// boşta kalmaz: Avatar bileşeni kullanıcı kimliğinden sabit bir tane türetir.
export interface Figure {
  bodyVariant: string;
  bodyColor: string;
  eyesVariant: string;
  mouthVariant: string;
  backgroundColor: string;
}

export interface User {
  id: string;
  name: string;
  figure?: Figure;
  photo?: string | null; // Google profil foto URL'si (varsa figürden öncelikli); yoksa null
  bio: string;
  role?: "admin";
  // Kulübe kabul edilmiş üye mi? Sadece Firebase Console'dan elle verilir
  // (kurallar istemcinin bu alanı yazmasını engeller). false/yok ise kişi
  // siteyi gezebilir ama hiçbir şey yazamaz.
  approved?: boolean;
  // Sohbet sayfasını en son ne zaman açtığı (ms). Navbar'daki okunmamış
  // rozetini hesaplamak için kullanılır; hiç yoksa "henüz hiç girmedi" demek.
  chatSeenAt?: number;
  // Kullanıcının bu yıl okumayı hedeflediği kitap sayısı. Yıl bilgisi
  // tutulmuyor — her Ocak'ta kullanıcı isterse yeni bir sayı girer, girmezse
  // eski hedef üzerinden ilerleme sıfırdan sayılmaya devam eder.
  readingGoal?: number;
}

// Bir kullanıcının bir kitapla ilişkisi (okudu / okuyor / okumak istiyor)
export type ShelfStatus = "read" | "reading" | "want";

// Kitap yorumu/değerlendirmesi
export interface Review {
  id: string;
  bookId: string;
  userId: string;
  rating: number;
  text: string;
  createdAt: number;
  updatedAt?: number;
}

// Üyelerin bir kitaptan sevdikleri alıntı
export interface Quote {
  id: string;
  bookId: string;
  userId: string;
  text: string;
  page?: string;
  createdAt: number;
  // Aynı pasajı işaretleyen diğer üyeler ("ben de"). Sohbet değil hemfikirlik:
  // cevap beklemez, bildirim gerektirmez, kimse basmazsa hiç görünmez.
  // Eski alıntılarda alan hiç yok — okurken daima `?? []` ile ele alınmalı.
  likedBy?: string[];
}

// Kullanıcının kişisel rafı: hangi kitap hangi durumda
export interface Shelf {
  id: string;
  userId: string;
  bookId: string;
  status: ShelfStatus;
  // Okuma ilerlemesi, yüzde (0–100). Sadece "reading" durumunda anlamlı;
  // "read" seçilince 100'e, "want" seçilince 0'a sabitlenir.
  progress?: number;
  updatedAt: number;
}

// Ayın kitabı oylaması için basit bir yapı
export interface Vote {
  id: string;
  month: string; // "2026-07" gibi
  userId: string;
  bookId: string;
  createdAt: number;
}

// Bir ayki oylama süreci (açık/kapalı ve kazanan)
export interface Election {
  id: string;
  month: string;
  status: "open" | "closed";
  winnerBookId?: string;
  finalizedBy?: string;
  finalizedAt?: number;
}

// Aylık okuma takvimine el ile eklenen kayıt
export interface ScheduleEntry {
  id: string;
  month: string;
  bookId: string;
  // Kulübün o ayki kitabı konuşacağı buluşmanın zamanı (ms). Yönetici belirler.
  meetingAt?: number | null;
  note?: string;
  setBy: string;
  createdAt: number;
}

// Bir üyenin o ayki buluşmaya katılım işareti. Belge id'si `${month}__${userId}`
// olduğu için bir üyenin bir ay için tek kaydı olur.
// "Belki" hâli bilerek yok: cevap vermemek zaten belki demek (kayıt yoksa kişi
// listede görünmez).
export interface Katilim {
  id: string;
  month: string; // "2026-08"
  userId: string;
  durum: "geliyor" | "gelemiyor";
  createdAt: number;
}

// Sohbet odasındaki tek bir mesaj. Alan adları Firestore'daki `mesajlar`
// koleksiyonuyla birebir aynı.
export interface Message {
  id: string;
  uid: string; // Yazan üyenin kimliği
  metin: string; // 1–2000 karakter
  createdAt: number; // Date.now() (ms)
  // İleriye dönük: bugün tek grup var, sorgularda kullanılmıyor. İkinci bir
  // grup gerçekten gerekirse taşıma tek satırlık iş olsun diye yazılıyor.
  grupId?: string;
}

// Ayın kitabı için yöneticinin girdiği tartışma sorusu.
// Ayrı koleksiyon: soruları kitap belgesinde dizi olarak tutsaydık, sıra
// değişince cevaplar yanlış soruya bağlanırdı. Sabit kimlik şart.
export interface Question {
  id: string;
  bookId: string;
  text: string;
  order: number;
  createdAt: number;
}

// Bir üyenin bir soruya verdiği cevap. Belge id'si `${questionId}__${uid}`
// olduğu için kişi başına soru başına tek cevap olur.
export interface Answer {
  id: string;
  questionId: string;
  bookId: string;
  userId: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
}

// Kullanıcılara verilebilecek rozetler
export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
}
