/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2020-08-27" });

export const getStripe = (stripeAccount: string) => {
    return new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2020-08-27", stripeAccount });
};

export default stripe;
