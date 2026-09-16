import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

// Configuração oficial do projeto Firebase braga-saude
const firebaseConfig = {
  apiKey: "AIzaSyDuZ_pQWOOciWAKI26DdpG_87n4sxhpCvQ",
  authDomain: "braga-saude.firebaseapp.com",
  projectId: "braga-saude",
  storageBucket: "braga-saude.firebasestorage.app",
  messagingSenderId: "626274351085",
  appId: "1:626274351085:web:cd16ecbecd2d64aa04d9e4",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
export type { User };
