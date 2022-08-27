import type { App } from "firebase-admin/app";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import env from "./env.server";

declare global {
  var __app: App | undefined;
}

export let app: App;

if (env.isProduction) {
  app = initializeApp({ credential: cert(env.FIREBASE_SERVICE_ACCOUNT) });
} else {
  if (!global.__app) {
    global.__app = initializeApp({ credential: cert(env.FIREBASE_SERVICE_ACCOUNT) });
  }
  app = global.__app;
}

export const auth = getAuth(app);
export const firestore = getFirestore(app);