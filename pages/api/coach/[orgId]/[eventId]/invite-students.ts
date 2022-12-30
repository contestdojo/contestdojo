/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import sendgrid from "@sendgrid/mail";
import firebase from "firebase-admin";

import { firestore, withFirebaseAuth } from "~/helpers/firebase";

sendgrid.setApiKey(process.env.SENDGRID_KEY as string);

const handler = withFirebaseAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { orgId, eventId } = req.query;
  if (typeof orgId !== "string") return res.status(400).end();
  if (typeof eventId !== "string") return res.status(400).end();

  const { emails } = req.body;
  if (!Array.isArray(emails)) return res.status(400).end();
  if (!emails.every((x) => typeof x === "string")) return res.status(400).end();

  const eventRef = firestore.collection("events").doc(eventId);
  const event = await eventRef.get();
  const eventData = event.data();
  if (!eventData) return res.status(404).end();

  const orgRef = firestore.collection("orgs").doc(orgId);
  const org = await orgRef.get();
  const orgData = org.data();
  if (!orgData) return res.status(400).end();

  const eventOrgRef = eventRef.collection("orgs").doc(orgId);
  const eventOrg = await eventOrgRef.get();
  const eventOrgData = eventOrg.data();
  if (!eventOrgData) return res.status(400).end();

  console.log(emails);

  await sendgrid.send({
    to: emails,
    isMultiple: true,
    from: "noreply@contestdojo.com",
    templateId: "d-243c5262c9844474a5281430b8deb946",
    dynamicTemplateData: { eventId, event: eventData.name, org: orgData.name, orgCode: eventOrgData.code },
  });

  const batch = firestore.batch();
  for (const email of emails) {
    batch.set(eventOrgRef.collection("invites").doc(email), {
      invited: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  res.status(200).end();
}, "coach");

export default handler;
