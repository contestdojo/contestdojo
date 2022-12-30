/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import { Box, Divider, Heading, Stack } from "@chakra-ui/react";
import firebase from "firebase";
import Hashids from "hashids";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useFirestore, useFirestoreDocData } from "reactfire";

import EventProvider, { useEvent } from "~/components/contexts/EventProvider";
import OrgProvider, { useOrg } from "~/components/contexts/OrgProvider";
import RegisterOrgForm from "~/components/forms/RegisterOrgForm";
import Markdown from "~/components/Markdown";
import { useFormState } from "~/helpers/utils";

const ApplyContent = () => {
  const router = useRouter();
  const firestore = useFirestore();

  const { ref: orgRef, data: org } = useOrg();
  const { ref: eventRef, data: event } = useEvent();

  const eventOrgRef = eventRef.collection("orgs").doc(orgRef.id);
  const { data: eventOrg } = useFirestoreDocData(eventOrgRef);

  useEffect(() => {
    if (eventOrg) {
      router.replace(`/coach/${orgRef.id}/${eventRef.id}/teams`);
    }
  }, [eventOrg]);

  // Form
  const [formState, wrapAction] = useFormState();

  const handleSubmit = wrapAction(async ({ customFields }) => {
    const hashids = new Hashids(`${eventRef.id}/orgs`, 4);

    await firestore.runTransaction(async (transaction) => {
      const counterRef = eventRef.collection("counters").doc("orgs");
      const counter = await transaction.get(counterRef);
      const next = counter.data()?.next ?? 0;
      transaction.set(counterRef, { next: next + 1 });

      transaction.set(
        eventOrgRef,
        {
          startTime: firebase.firestore.FieldValue.serverTimestamp(),
          updateTime: firebase.firestore.FieldValue.serverTimestamp(),
          customFields: customFields ?? {},
          code: hashids.encode(next),
        },
        { merge: true }
      );
    });
  });

  if (eventOrg) {
    return null;
  }

  return (
    <Stack spacing={6} maxWidth={600} mx="auto">
      <Heading size="2xl" flexShrink={0}>
        {event.name}
      </Heading>

      <Heading size="lg" flex={1}>
        {org.name}
      </Heading>

      <Divider />

      <Stack spacing={4}>
        {event.description && (
          <>
            <Box mb={-4}>
              <Markdown>{event.description}</Markdown>
            </Box>
            <Divider />
          </>
        )}
      </Stack>

      <Stack spacing={4}>
        <RegisterOrgForm
          initial
          onSubmit={handleSubmit}
          customFields={event.customOrgFields}
          buttonText="Begin Registration"
          {...formState}
        />
      </Stack>
    </Stack>
  );
};

const Index = () => (
  <OrgProvider>
    <EventProvider>
      <ApplyContent />
    </EventProvider>
  </OrgProvider>
);

export default Index;
