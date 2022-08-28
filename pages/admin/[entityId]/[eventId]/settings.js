/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Button, Heading, HStack, Stack, Switch, Text } from "@chakra-ui/react";
import firebase from "firebase";
import { useAuth } from "reactfire";

import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import EventForm from "~/components/forms/EventForm";
import { useFormState } from "~/helpers/utils";

const EventDetails = () => {
  const { ref: eventRef, data: event } = useEvent();
  const [formState, wrapAction] = useFormState();
  const [openDialog] = useDialog();
  const auth = useAuth();

  const handleCheck = async (e) => {
    await eventRef.update({ frozen: e.target.checked });
  };

  const handleSubmit = wrapAction(async (values) => {
    await eventRef.update(
      Object.fromEntries(
        Object.entries(values).map(([k, v]) =>
          // Empty field = delete
          v === "" ? [k, firebase.firestore.FieldValue.delete()] : [k, v]
        )
      )
    );
  });

  // Roster

  const handleAssignNumbers = () => {
    openDialog({
      type: "confirm",
      title: "Are you sure?",
      description:
        "Previously assigned team numbers will not be changed. Student numbers may change only if their team's number has changed.",
      onConfirm: async () => {
        const authorization = await auth.currentUser.getIdToken();
        await fetch(`/api/admin/${event.owner.id}/${event.id}/set_numbers`, {
          method: "POST",
          headers: { authorization },
        });
      },
    });
  };

  return (
    <>
      <Card as={Stack} spacing={4} p={4} maxWidth="xl">
        <Heading size="md">Roster</Heading>
        <HStack>
          <Switch isChecked={event.frozen} onChange={handleCheck} />
          <Text>Freeze roster changes</Text>
        </HStack>
        <Button onClick={handleAssignNumbers} alignSelf="flex-start">
          Assign Team/Student Numbers
        </Button>
      </Card>
      <Card as={Stack} spacing={4} p={4}>
        <Heading size="md">Event Details</Heading>
        <EventForm
          key={event.id}
          onSubmit={handleSubmit}
          buttonText="Update Event"
          defaultValues={event}
          {...formState}
        />
      </Card>
    </>
  );
};

export default EventDetails;
