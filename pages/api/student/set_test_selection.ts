/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { firestore, withFirebaseAuth } from "~/helpers/firebase";

const handler = withFirebaseAuth(async (req, res, { uid }) => {
  if (req.method !== "POST") return res.status(405).end();

  const { eventId, selection } = req.body;
  if (!Array.isArray(selection)) return res.status(400).end();
  if (typeof eventId !== "string") return res.status(400).end();

  const studentRef = firestore.collection("events").doc(eventId).collection("students").doc(uid);
  const student = await studentRef.get();
  const studentData = student.data();

  if (!studentData) return res.status(404).end();
  if (studentData.startedSelected) return res.status(400).send("You have already started your test.");

  await studentRef.update({ testSelection: selection });

  res.status(204).end();
}, "student");

export default handler;
