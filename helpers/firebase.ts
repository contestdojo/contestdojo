import * as admin from "firebase-admin";

const cert = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(cert) });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
