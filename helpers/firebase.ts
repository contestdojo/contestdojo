/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import * as admin from "firebase-admin";
import { NextApiRequest, NextApiResponse } from "next";

const cert = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(cert),
    storageBucket: "ncmt-67ea1.appspot.com",
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage().bucket();

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
