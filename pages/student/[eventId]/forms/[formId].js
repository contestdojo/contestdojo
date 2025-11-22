/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Heading, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { useFirestoreCollectionData, useFirestoreDocData, useUser } from "reactfire";
import * as yup from "yup";

import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";
import { makeCustomFieldsSchema, renderCustomFields } from "~/components/forms/customFields";
import Markdown from "~/components/Markdown";
import { useFormState } from "~/helpers/utils";

const FormPage = () => {
  const { data: user } = useUser();
  const { ref: eventRef } = useEvent();
  const router = useRouter();
  const { eventId, formId } = router.query;

  const [formState, wrapAction] = useFormState();

  // Fetch the form
  const formRef = eventRef.collection("forms").doc(formId);
  const { data: form } = useFirestoreDocData(formRef, { idField: "id" });

  // Check if student has already submitted this form
  const responseRef = eventRef.collection("forms").doc(formId).collection("responses").doc(user.uid);
  const { data: existingResponse } = useFirestoreCollectionData(
    eventRef.collection("forms").doc(formId).collection("responses").where("__name__", "==", user.uid),
    { idField: "id" }
  );

  const hasSubmitted = existingResponse && existingResponse.length > 0;

  const schema = yup.object({
    responses: makeCustomFieldsSchema(true, form?.fields || []),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: hasSubmitted ? { responses: existingResponse[0].responses } : {},
  });

  if (!form) return null;

  const onSubmit = wrapAction(async (values) => {
    await responseRef.set({
      responses: values.responses,
      submittedAt: new Date(),
    });
    router.push(`/student/${eventId}`);
  });

  return (
    <Stack spacing={6} flexBasis={600}>
      <ButtonLink href={`/student/${eventId}`} variant="link" alignSelf="flex-start">
        ← Back to Event
      </ButtonLink>

      <Heading size="lg">{form.name}</Heading>

      {form.description && (
        <Box mt={-2}>
          <Markdown>{form.description}</Markdown>
        </Box>
      )}

      {hasSubmitted && (
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Form Submitted</AlertTitle>
            <AlertDescription>You can update your responses below if needed.</AlertDescription>
          </Box>
        </Alert>
      )}

      <Stack as="form" onSubmit={handleSubmit(onSubmit)} spacing={4}>
        {renderCustomFields(!hasSubmitted, form.fields || [], register, errors, "responses")}

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={formState.isLoading}
          isDisabled={formState.isLoading}
          alignSelf="flex-start"
        >
          {hasSubmitted ? "Update Responses" : "Submit Form"}
        </Button>

        {formState.error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {formState.error.message}
          </Alert>
        )}
      </Stack>
    </Stack>
  );
};

export default FormPage;
