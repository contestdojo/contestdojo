/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { firestore as adminFirestore } from "firebase-admin";
import { NextApiRequest, NextApiResponse } from "next";
import getRawBody from "raw-body";
import Stripe from "stripe";

import { firestore } from "~/helpers/firebase";
import stripe from "~/helpers/stripe";

const processCheckoutSessionCompleted = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Stripe.Checkout.Session
) => {
  if (!session.metadata?.__contestdojo__) return res.status(200).end("Not ContestDojo, ignoring");

  if (session.metadata?.registrationType === "org") {
    let { number, addonId, eventId, orgId, billByTeam, numTeams } = session.metadata ?? {};
    if (typeof number !== "string" && typeof number !== "number") return res.status(400).end("Missing num seats");
    if (typeof eventId !== "string") return res.status(400).end("Missing event id");
    if (typeof orgId !== "string") return res.status(400).end("Missing org id");

    // Get event

    const eventOrgRef = firestore.collection("events").doc(eventId).collection("orgs").doc(orgId);
    if (addonId) {
      await eventOrgRef.update(
        new adminFirestore.FieldPath("addOns", addonId),
        adminFirestore.FieldValue.increment(Number(number))
      );
    } else {
      await eventOrgRef.set({ maxStudents: adminFirestore.FieldValue.increment(Number(number)) }, { merge: true });
    }

    // When billByTeam is enabled, auto-create teams after payment
    if (billByTeam === "true" && numTeams) {
      const teamsRef = firestore.collection("events").doc(eventId).collection("teams");
      const orgRef = firestore.collection("orgs").doc(orgId);

      const teamsToCreate = Number(numTeams);
      for (let i = 0; i < teamsToCreate; i++) {
        await teamsRef.add({
          name: `Team ${Date.now()}-${i + 1}`,
          org: orgRef,
        });
      }
    }

    return res.status(200).end();
  }

  if (session.metadata?.registrationType === "student") {
    let { eventId, studentId } = session.metadata ?? {};
    if (typeof eventId !== "string") return res.status(400).end("Missing event id");
    if (typeof studentId !== "string") return res.status(400).end("Missing student id");

    // Get event

    const userRef = firestore.collection("users").doc(studentId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    if (!userData) return res.status(400).end("Unknown user");

    const pendingStudentRef = firestore.collection("events").doc(eventId).collection("pending-students").doc(studentId);
    const pendingUserSnap = await pendingStudentRef.get();
    const pendingUserData = pendingUserSnap.data();

    const studentRef = firestore.collection("events").doc(eventId).collection("students").doc(studentId);
    await studentRef.set(
      {
        ...pendingUserData,
        id: studentId,
        email: userData.email,
        user: userRef,
        org: null,
        stripeSessionId: session.id,
      },
      { merge: true }
    );

    // Delete the pending registration after successful payment
    await pendingStudentRef.delete();

    return res.status(200).end();
  }

  res.status(400).end();
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).end();

  let stripeEvent;
  try {
    const rawBody = await getRawBody(req);
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${(err as any).message}`);
  }

  switch (stripeEvent.type) {
    case "checkout.session.completed":
      await processCheckoutSessionCompleted(req, res, stripeEvent.data.object as Stripe.Checkout.Session);
    default:
      res.status(204).end();
  }
};

export default handler;

export const config = {
  api: { bodyParser: false },
};
