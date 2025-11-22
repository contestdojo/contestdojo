/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Badge, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useFirestoreCollectionData } from "reactfire";

import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";
import { CustomField } from "~/components/forms/customFields";

export type Form = {
  id: string;
  name: string;
  fields: CustomField[];
};

type StudentFormsProps = {
  studentId: string;
};

const FormListItem = ({ form, studentId, eventId }: { form: Form; studentId: string; eventId: string }) => {
  const { ref: eventRef } = useEvent();
  const router = useRouter();

  // Check if student has already submitted this form
  const { data: existingResponse } = useFirestoreCollectionData(
    eventRef.collection("forms").doc(form.id).collection("responses").where("__name__", "==", studentId),
    { idField: "id" }
  );

  const hasSubmitted = existingResponse && existingResponse.length > 0;

  return (
    <Card p={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <HStack spacing={3} flex="1">
          <Text fontWeight="medium">{form.name}</Text>
          {hasSubmitted && (
            <Badge colorScheme="green" fontSize="xs">
              Submitted
            </Badge>
          )}
        </HStack>
        <Button size="sm" colorScheme="blue" onClick={() => router.push(`/student/${eventId}/forms/${form.id}`)}>
          {hasSubmitted ? "Update" : "Fill Out"}
        </Button>
      </HStack>
    </Card>
  );
};

const StudentForms = ({ studentId }: StudentFormsProps) => {
  const { ref: eventRef } = useEvent();
  const router = useRouter();
  const eventId = router.query.eventId as string;

  // Fetch all forms for this event
  const formsRef = eventRef.collection("forms");
  const { data: forms } = useFirestoreCollectionData(formsRef, { idField: "id" });

  if (!forms || forms.length === 0) {
    return null;
  }

  return (
    <Stack spacing={4}>
      <Heading size="lg">Forms</Heading>
      {forms.map((form: any) => (
        <FormListItem key={form.id} form={form as Form} studentId={studentId} eventId={eventId} />
      ))}
    </Stack>
  );
};

export default StudentForms;
