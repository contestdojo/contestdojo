import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const app = initializeApp({
  apiKey: "AIzaSyAOOHi3dy5rYfJWiXJBEF4h_qJChyxIQLU",
  authDomain: "ncmt-67ea1.firebaseapp.com",
  projectId: "ncmt-67ea1",
  storageBucket: "ncmt-67ea1.appspot.com",
  messagingSenderId: "97736862094",
  appId: "1:97736862094:web:ba9e69371bd2b129b15cdf",
});

export const auth = getAuth(app);
