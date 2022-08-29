/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { initializeApp } from "firebase/app";
import { getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";

export const app = initializeApp({
  apiKey: "AIzaSyAOOHi3dy5rYfJWiXJBEF4h_qJChyxIQLU",
  authDomain: "ncmt-67ea1.firebaseapp.com",
  projectId: "ncmt-67ea1",
  storageBucket: "ncmt-67ea1.appspot.com",
  messagingSenderId: "97736862094",
  appId: "1:97736862094:web:ba9e69371bd2b129b15cdf",
});

export const auth = getAuth(app);

setPersistence(auth, inMemoryPersistence);
