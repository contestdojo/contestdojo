/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import sendgrid from "@sendgrid/mail";
import absoluteUrl from "next-absolute-url";

import { firestore, withFirebaseAuth } from "~/helpers/firebase";

sendgrid.setApiKey(process.env.SENDGRID_KEY as string);

const handler = withFirebaseAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { eventId, studentId, parentEmail } = req.body;
  if (typeof eventId !== "string") return res.status(400).end();
  if (typeof studentId !== "string") return res.status(400).end();
  if (typeof parentEmail !== "string") return res.status(400).end();

  const studentRef = firestore.collection("events").doc(eventId).collection("students").doc(studentId);
  const student = await studentRef.get();
  const { fname, lname } = student.data() as any;

  const eventRef = firestore.collection("events").doc(eventId);
  const event = await eventRef.get();
  const { name } = event.data() as any;

  const { origin } = absoluteUrl(req);

  await sendgrid.send({
    to: parentEmail,
    from: "noreply@contestdojo.com",
    templateId: "d-1131a5a39e3b42e4abc1324f913ad462",
    dynamicTemplateData: { fname, lname, event: name, url: `${origin}/public/${eventId}/waivers/${studentId}` },
  });

  res.status(204).end();
}, "student");

export default handler;
