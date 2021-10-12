/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import sendgrid from "@sendgrid/mail";
import { FirebaseError } from "firebase-admin";
import generator from "generate-password";

import { auth, firestore, withFirebaseAuth } from "~/helpers/firebase";

sendgrid.setApiKey(process.env.SENDGRID_KEY as string);

const handler = withFirebaseAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { fname, lname, email } = req.body;
  if (typeof fname !== "string") return res.status(400).end();
  if (typeof lname !== "string") return res.status(400).end();
  if (typeof email !== "string") return res.status(400).end();

  let user;
  let existed = false;

  try {
    user = await auth.getUserByEmail(email);
    existed = true;
  } catch (e) {
    // Create new user
    const error = e as FirebaseError;
    if (error.code !== "auth/user-not-found") return res.status(500).send(error.message);

    const password = generator.generate({ length: 12, numbers: true });

    // User didn't exist, create user now
    user = await auth.createUser({
      email,
      password,
      displayName: `${fname} ${lname}`,
    });

    // Set info in firestore
    await firestore.collection("users").doc(user.uid).set({
      fname,
      lname,
      email,
      type: "student",
    });

    await sendgrid.send({
      to: email,
      from: "noreply@contestdojo.com",
      templateId: "d-8c5c1f774b5c41138c5018d05396ecd0",
      dynamicTemplateData: { fname, lname, email, password },
    });
  }

  // Get user data
  const snapshot = await firestore.collection("users").doc(user.uid).get();
  const userData = snapshot.data();

  // Make sure student account
  if (!userData || userData.type !== "student") {
    return res.status(400).send("This email address is already associated with a non-student account.");
  }

  if (existed) {
    await sendgrid.send({
      to: email,
      from: "noreply@contestdojo.com",
      templateId: "d-9dc72fe2480446ff82daf4cd947e5866",
      dynamicTemplateData: { fname, lname, email },
    });
  }

  res.status(200).json({
    existed,
    fname: userData.fname,
    lname: userData.lname,
    email: userData.email,
    uid: user.uid,
  });
}, "coach");

export default handler;
