/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { App } from "firebase-admin/app";

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import env from "~/lib/env.server";

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
export const storage = getStorage(app).bucket("gs://ncmt-67ea1.appspot.com");
