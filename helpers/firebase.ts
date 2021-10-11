import * as admin from "firebase-admin";
import { NextApiRequest, NextApiResponse } from "next";

const cert = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(cert) });
}

export const auth = admin.auth();
export const firestore = admin.firestore();

type FirebaseHandler = (req: NextApiRequest, res: NextApiResponse, context: FirebaseContext) => void;
type FirebaseContext = { uid: string };

export const withFirebaseAuth = (func: FirebaseHandler, accountType?: "student" | "coach" | "admin") => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        let uid;
        try {
            const token = await auth.verifyIdToken(req.headers.authorization ?? "");
            uid = token.uid;
        } catch (e) {
            return res.status(401).end();
        }

        if (accountType) {
            const user = await firestore.collection("users").doc(uid).get();
            const userData = user.data();
            if (!userData || userData.type !== accountType) {
                return res.status(401).end();
            }
        }

        return func(req, res, { uid });
    };
};
