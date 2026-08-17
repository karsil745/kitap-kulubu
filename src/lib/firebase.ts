// Firebase bağlantısı burada bir kez kurulur ve tüm uygulama bunu paylaşır.
// Ayarlar .env.local dosyasından okunur (bkz. .env.example).
// Bu dosyadaki değerler gizli değildir (tarayıcıya gider), ama yine de
// kod deposuna yazmamak için .env.local kullanıyoruz.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Firestore: veritabanımız (kitaplar, yazarlar, kullanıcılar)
export const db = getFirestore(app);

// Auth: giriş sistemi. Google ile giriş için sağlayıcıyı da hazırlıyoruz.
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
