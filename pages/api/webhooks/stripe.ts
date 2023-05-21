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
    let { numSeats, eventId, orgId } = session.metadata ?? {};
    if (typeof numSeats !== "string" && typeof numSeats !== "number") return res.status(400).end("Missing num seats");
    if (typeof eventId !== "string") return res.status(400).end("Missing event id");
    if (typeof orgId !== "string") return res.status(400).end("Missing org id");

    // Get event

    const eventOrgRef = firestore.collection("events").doc(eventId).collection("orgs").doc(orgId);
    await eventOrgRef.set({ maxStudents: adminFirestore.FieldValue.increment(Number(numSeats)) }, { merge: true });

    return res.status(200).end();
  }

  if (session.metadata?.registrationType === "student") {
    let { eventId, studentId, registrationData } = session.metadata ?? {};
    if (typeof eventId !== "string") return res.status(400).end("Missing event id");
    if (typeof studentId !== "string") return res.status(400).end("Missing student id");
    if (typeof registrationData !== "string") return res.status(400).end("Missing registration data");

    // Get event

    const userRef = firestore.collection("users").doc(studentId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    if (!userData) return res.status(400).end("Unknown user");

    const studentRef = firestore.collection("events").doc(eventId).collection("students").doc(studentId);
    await studentRef.set(
      {
        ...JSON.parse(registrationData),
        id: studentId,
        email: userData.email,
        user: userRef,
        org: null,
        stripeSessionId: session.id,
      },
      { merge: true }
    );

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
