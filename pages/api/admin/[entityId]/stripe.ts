/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import absoluteUrl from "next-absolute-url";

import { firestore, withFirebaseAuth } from "~/helpers/firebase";
import stripe from "~/helpers/stripe";

const handler = withFirebaseAuth(async (req, res, { uid }) => {
  if (req.method !== "POST") return res.status(405).end();

  const { entityId } = req.query;
  if (typeof entityId !== "string") return res.status(400).end();

  const entityRef = firestore.collection("entities").doc(entityId);
  const entity = await entityRef.get();
  const entityData = entity.data();

  if (!entityData) return res.status(404).end();
  if (!entityData.admins.some((x: any) => x.id === uid)) return res.status(401).end();

  let accountId = entityData.stripeAccountId as string;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "standard",
      business_profile: { name: entityData.name as string },
    });
    await entityRef.update({ stripeAccountId: account.id });
    accountId = account.id;
  }

  const { origin } = absoluteUrl(req);

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/api/admin/${entityId}/stripe`,
    return_url: `${origin}/admin/${entityId}`,
    type: "account_onboarding",
  });

  res.status(200).send(link);
}, "admin");

export default handler;
