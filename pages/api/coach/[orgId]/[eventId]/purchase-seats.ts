/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import sendgrid from "@sendgrid/mail";
import absoluteUrl from "next-absolute-url";

import { firestore, withFirebaseAuth } from "~/helpers/firebase";
import { testRule } from "~/helpers/rules";
import stripe from "~/helpers/stripe";

sendgrid.setApiKey(process.env.SENDGRID_KEY as string);

const handler = withFirebaseAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  // Validate query & body

  const { orgId, eventId } = req.query;
  if (typeof orgId !== "string") return res.status(400).end();
  if (typeof eventId !== "string") return res.status(400).end();

  const { email, addonId, number } = req.body;
  if (typeof email !== "string") return res.status(400).end();
  if (typeof number !== "number") return res.status(400).end();

  // Get connected account

  const eventRef = firestore.collection("events").doc(eventId);
  const event = await eventRef.get();
  const eventData = event.data();
  if (!eventData) return res.status(404).end();

  const addon = addonId && eventData.addOns?.find((x: any) => x.id === addonId);
  if (addonId && !addon) return res.status(400).end("Add-on not found");
  if (addon && !addon.enabled) return res.status(400).end("Add-on is not enabled");

  const entity = await eventData.owner.get();
  const entityData = entity.data();

  if (!entityData) return res.status(404).end();
  if (!entityData.stripeAccountId) return res.status(400).end("The event organizer has not yet configured payments.");

  // Calculate number of seats to purchase
  // When billByTeam is true, multiply by studentsPerTeam
  const billByTeam = eventData.billByTeam;
  const studentsPerTeam = eventData.studentsPerTeam ?? 1;
  const actualSeats = billByTeam ? number * studentsPerTeam : number;

  if (!addon && eventData.maxStudents != undefined) {
    const eventOrgs = await eventRef.collection("orgs").get();
    const numStudents = eventOrgs.docs.reduce((acc, cur) => acc + (cur.data().maxStudents ?? 0), 0);
    const remainingSeats = eventData.maxStudents - numStudents;
    if (remainingSeats < 0) return res.status(400).end("This event is no longer accepting registrations.");
    if (actualSeats > remainingSeats) {
      if (billByTeam) {
        const remainingTeams = Math.floor(remainingSeats / studentsPerTeam);
        return res.status(400).end(`There are only ${remainingTeams} teams remaining.`);
      }
      return res.status(400).end(`There are only ${remainingSeats} seats remaining.`);
    }
  }

  // Calculate effective cost

  const eventOrgRef = eventRef.collection("orgs").doc(orgId);
  const eventOrg = await eventOrgRef.get();
  const eventOrgData = eventOrg.data();
  if (!eventOrgData) return res.status(400).end();

  let effectiveCostPerStudent = eventData.costPerStudent;
  for (const adjustment of eventData.costAdjustments ?? []) {
    if (testRule(adjustment.rule, eventOrgData)) {
      effectiveCostPerStudent += adjustment.adjustment;
    }
  }

  // Calculate number of students per org

  if (!addon && eventData.maxStudentsPerOrg != undefined) {
    const remainingSeats = eventData.maxStudentsPerOrg - (eventOrgData.maxStudents ?? 0);
    if (actualSeats > remainingSeats) {
      if (billByTeam) {
        const remainingTeams = Math.floor(remainingSeats / studentsPerTeam);
        return res
          .status(400)
          .end(
            `This event currently allows up to ${Math.floor(
              eventData.maxStudentsPerOrg / studentsPerTeam
            )} teams per organization. ` +
              `Your organization can only purchase a maximum of ${remainingTeams} additional teams. `
          );
      }
      return res
        .status(400)
        .end(
          `This event currently allows up to ${eventData.maxStudentsPerOrg} seats per organization. ` +
            `Your organization can only purchase a maximum of ${remainingSeats} additional seats. `
        );
    }
  }

  // Do payment

  const customers = await stripe.customers.list({ email, limit: 1 }, { stripeAccount: entityData.stripeAccountId });
  const customer: any = {};
  if (customers["data"].length === 0) {
    customer["customer_email"] = email;
  } else {
    customer["customer"] = customers["data"][0].id;
  }

  const { origin } = absoluteUrl(req);
  // Store actualSeats in metadata so the webhook knows how many seats to add
  const metadata = { __contestdojo__: true, registrationType: "org", orgId, eventId, addonId, number: actualSeats };

  // For billByTeam, charge per team (cost per student * students per team)
  // For regular seats, charge per student
  const unitAmount = billByTeam
    ? effectiveCostPerStudent * studentsPerTeam * 100
    : (addon ? addon.cost : effectiveCostPerStudent) * 100;
  const application_fee_amount = (eventData.fee ?? (eventData.feeFactor ?? 0) * unitAmount) * number;

  // Product name reflects what the user is purchasing
  const productName = addon
    ? `${addon.name} for ${eventData.name}`
    : billByTeam
    ? `Team for ${eventData.name}`
    : `Student Seat for ${eventData.name}`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      payment_intent_data: { metadata, application_fee_amount },
      metadata,
      line_items: [
        {
          price_data: {
            unit_amount: unitAmount,
            currency: "usd",
            product_data: {
              name: productName,
            },
          },
          quantity: number,
        },
      ],
      success_url: `${origin}/coach/${orgId}/${eventId}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/coach/${orgId}/${eventId}/teams`,
      allow_promotion_codes: true,
      ...customer,
    },
    { stripeAccount: entityData.stripeAccountId }
  );

  res.status(200).json({ id: session.id });
}, "coach");

export default handler;
