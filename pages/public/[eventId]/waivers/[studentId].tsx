/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";
import NoSSR from "react-no-ssr";
import { useFirestoreDocData, useStorage, useStorageDownloadURL } from "reactfire";

import Card from "~/components/Card";
import EventProvider, { useEvent } from "~/components/contexts/EventProvider";
import WaiverEditor from "~/components/WaiverEditor";
import WaiverProvider, { useWaiver } from "~/components/WaiverEditor/WaiverProvider";
import { useFormState } from "~/helpers/utils";

const WaiverConfirmModal = ({ pdf, onCancel, onConfirm }) => {
  const [{ isLoading, error }, wrapAction] = useFormState();

  return (
    <Modal closeOnEsc={false} closeOnOverlayClick={false} isOpen={!!pdf} onClose={onCancel} size="6xl">
      <ModalOverlay />
      <ModalContent height="80%">
        <ModalHeader>Confirm Waiver Submission</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDir="column">
          {error ? (
            <Alert status="error" mb={3}>
              <AlertIcon />
              {error.message}
            </Alert>
          ) : (
            <Alert status="warning" mb={3}>
              <AlertIcon />
              Please make a final confirmation to complete your waiver submission.
            </Alert>
          )}

          <Box flex={1} as="iframe" width="100%" src={`${pdf}#toolbar=0`} />
        </ModalBody>

        <ModalFooter>
          <Button onClick={onCancel} mr={3}>
            Cancel
          </Button>
          <Button colorScheme="blue" isLoading={isLoading} onClick={wrapAction(onConfirm)}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SubmittedWaiver = ({ waiver }) => {
  const storage = useStorage();
  const { data: waiverURL } = useStorageDownloadURL(storage.ref().child(waiver));
  return <iframe width="100%" height="100%" src={waiverURL} />;
};

const WaiverContent = () => {
  const { values } = useWaiver();
  const [submittedPDF, setSubmittedPDF] = useState();
  const completed = !Object.values(values).includes(null);

  const { studentId } = useRouter().query;

  const { ref: eventRef, data: event } = useEvent();
  const studentRef = eventRef.collection("students").doc(studentId);
  const { data: student } = useFirestoreDocData(studentRef, { idField: "id" });

  const [{ isLoading, error }, wrapAction] = useFormState();

  const handleSubmit = wrapAction(async (e) => {
    if (!completed) return;

    const resp = await fetch("/api/student/generate_waiver", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ waiver: event.waiver, values }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const blob = await resp.blob();
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    setSubmittedPDF(base64);
  });

  const handleConfirm = async () => {
    const resp = await fetch("/api/student/submit_waiver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: eventRef.id, studentId, waiver: submittedPDF }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    setSubmittedPDF(undefined);
  };

  if (!student || !event.waiver) {
    return (
      <Alert status="error">
        <AlertIcon />
        Waiver Not Found
      </Alert>
    );
  }

  if (student.waiver) {
    return (
      <Stack maxW="5xl" height="100vh" mx="auto" p={8} spacing={4}>
        <Alert status="success">
          <AlertIcon />
          The waiver has been submitted. You can view it below.
        </Alert>
        <SubmittedWaiver waiver={student.waiver} />
      </Stack>
    );
  }

  return (
    <Stack maxW="5xl" minHeight="100vh" mx="auto" p={8} spacing={4}>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error.message}
        </Alert>
      )}

      <Card p={4} flex={1}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <WaiverEditor>{event.waiver}</WaiverEditor>
          {isLoading && (
            <Alert status="warning" mb={4}>
              <AlertIcon />
              Your waiver is being generated. Please do not close this tab.
            </Alert>
          )}
          <Button type="submit" colorScheme="blue" isLoading={isLoading}>
            Submit
          </Button>
        </form>
        <WaiverConfirmModal pdf={submittedPDF} onCancel={() => setSubmittedPDF(undefined)} onConfirm={handleConfirm} />
      </Card>
    </Stack>
  );
};

const Waiver = () => (
  <NoSSR>
    <EventProvider>
      <WaiverProvider>
        <WaiverContent />
      </WaiverProvider>
    </EventProvider>
  </NoSSR>
);

export default Waiver;

Waiver.layoutProps = {
  maxW: undefined,
};
