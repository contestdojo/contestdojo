/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck
import { Box, Button, Divider, Heading, HStack, Icon, Stack, Text, Tooltip } from "@chakra-ui/react";
import dayjs from "dayjs";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { HiCheckCircle, HiClock } from "react-icons/hi";
import { useAuth, useFirestore, useFirestoreCollectionData } from "reactfire";

import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import EntityProvider, { useEntity } from "~/components/contexts/EntityProvider";
import EntityForm from "~/components/forms/EntityForm";
import { firestore } from "~/helpers/firebase";
import stripe from "~/helpers/stripe";
import { useFormState } from "~/helpers/utils";

const EventCard = ({ id, name, owner, date: { seconds } }) => {
  const date = dayjs.unix(seconds);
  return (
    <Card p={6} maxWidth="sm">
      <Box as="h4" fontWeight="semibold" isTruncated>
        {name}
      </Box>
      <Box as="h5" color="gray.500">
        {date.format("M/D/YYYY")}
      </Box>
      <ButtonLink href={`/admin/${owner.id}/${id}`} mt={2} colorScheme="blue" size="sm">
        Manage
      </ButtonLink>
    </Card>
  );
};

const EntityContent = ({ account }) => {
  const auth = useAuth();
  const firestore = useFirestore();

  // Get org
  const { ref: entityRef, data: entity } = useEntity();

  // Get events
  const eventsRef = firestore.collection("events").where("owner", "==", entityRef);
  const { data: events } = useFirestoreCollectionData(eventsRef, { idField: "id" });

  // Form
  const [formState, wrapAction] = useFormState();
  const handleUpdate = wrapAction(async ({ name }) => {
    await entityRef.update({ name });
  });

  // Stripe
  const [loading, setLoading] = useState(false);
  const handleSetupStripe = async () => {
    setLoading(true);
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch(`/api/admin/${entityRef.id}/stripe`, {
      method: "POST",
      headers: { authorization },
    });
    const link = await resp.json();
    window.location.assign(link.url);
  };

  return (
    <Stack spacing={6} maxW={600} mx="auto">
      <Heading size="2xl">{entity.name}</Heading>

      <Divider />

      <Heading size="lg">Events</Heading>
      {events.map((x) => (
        <EventCard key={x.id} {...x} />
      ))}

      <Divider />

      <Heading size="lg">Payments</Heading>
      {account && account.business_profile ? (
        <Card as={HStack} spacing={4} p="4">
          {account.charges_enabled ? (
            <Icon as={HiCheckCircle} color="green.500" w={10} h={10} />
          ) : (
            <Tooltip label="Pending Verification">
              <span>
                <Icon as={HiClock} color="yellow.500" w={10} h={10} />
              </span>
            </Tooltip>
          )}

          <Stack spacing={0}>
            <Heading size="sm">{account.business_profile.name}</Heading>
            <Text>{account.business_profile.url}</Text>
          </Stack>
        </Card>
      ) : (
        <Button colorScheme="blue" alignSelf="flex-start" onClick={handleSetupStripe} isLoading={loading}>
          Setup Stripe Payments
        </Button>
      )}

      <Divider />

      <Heading size="lg">Entity Details</Heading>
      <EntityForm
        key={entity.id}
        onSubmit={handleUpdate}
        buttonText="Update Entity"
        defaultValues={entity}
        {...formState}
      />
    </Stack>
  );
};

const Entity = ({ account }) => (
  <EntityProvider>
    <EntityContent account={account} />
  </EntityProvider>
);

export default Entity;

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.params) return { notFound: true };

  const entityRef = firestore.collection("entities").doc(context.params.entityId.toString());
  const entity = await entityRef.get();
  const entityData = entity.data();

  if (!entityData) return { notFound: true };

  if (entityData.stripeAccountId) {
    const account = await stripe.accounts.retrieve(entityData.stripeAccountId);
    return { props: { account } };
  }

  return { props: {} };
};
