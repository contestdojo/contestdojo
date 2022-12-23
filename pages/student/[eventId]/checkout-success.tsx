/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Heading, Stack } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { useFirestore, useFirestoreDocData } from "reactfire";
import Stripe from "stripe";

import ButtonLink from "~/components/ButtonLink";
import { firestore } from "~/helpers/firebase";
import stripe from "~/helpers/stripe";

const format = new Intl.NumberFormat(undefined, {
  currency: "usd",
  style: "currency",
  maximumFractionDigits: 2,
});

type CheckoutSuccessProps = {
  session: Stripe.Checkout.Session;
};

const CheckoutSuccess = ({ session }: CheckoutSuccessProps) => {
  const { eventId } = session.metadata as any;

  const firestore = useFirestore();

  const eventRef = firestore.collection("events").doc(eventId);
  const { data: event } = useFirestoreDocData<any>(eventRef);

  return (
    <Stack spacing={6} maxW={600} mx="auto">
      <Heading size="lg">Purchase Success!</Heading>
      <Stack spacing={4}>
        <p>
          Your payment of <b>{format.format((session.amount_total ?? 0) / 100)}</b> was successful, and a receipt has
          been emailed to <b>{session.customer_details?.email}</b>.
        </p>
        <p>You are now registered for {event.name}.</p>
        <p>For any questions or concerns, please contact the event organizer.</p>
      </Stack>
      <ButtonLink colorScheme="blue" href={`/student/${eventId}`}>
        Return to Event
      </ButtonLink>
    </Stack>
  );
};

export default CheckoutSuccess;

type CheckoutSuccessParams = {
  eventId: string;
};

export const getServerSideProps: GetServerSideProps<CheckoutSuccessProps, CheckoutSuccessParams> = async ({
  params,
  query: { session_id },
}) => {
  if (!params) return { notFound: true };
  if (typeof session_id !== "string") return { notFound: true };

  const { eventId } = params;

  const eventRef = firestore.collection("events").doc(eventId);
  const event = await eventRef.get();
  const eventData = event.data();

  if (!eventData) return { notFound: true };

  const entity = await eventData.owner.get();
  const entityData = entity.data();

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id.toString(), {
      stripeAccount: entityData.stripeAccountId,
    });
  } catch (e) {
    return { notFound: true };
  }

  return {
    props: {
      session,
    },
  };
};
