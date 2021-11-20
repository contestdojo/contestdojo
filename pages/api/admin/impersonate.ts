/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { auth, firestore, withFirebaseAuth } from "~/helpers/firebase";

const handler = withFirebaseAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { uid } = req.body;
  if (typeof uid !== "string") return res.status(400).end();

  const userRef = firestore.collection("users").doc(uid);
  const user = await userRef.get();
  const userData = user.data();

  if (!userData) return res.status(404).end();
  if (userData.type === "admin") return res.status(400).end();

  const token = await auth.createCustomToken(uid);

  res.status(200).send(token);
}, "admin");

export default handler;
