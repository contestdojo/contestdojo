import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import env from "./env.server";

export const app = initializeApp({
  credential: cert(env.FIREBASE_SERVICE_ACCOUNT),
});

export const auth = getAuth(app);
export const firestore = getFirestore(app);
