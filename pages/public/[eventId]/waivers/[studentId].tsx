/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import {
  Alert,
  AlertIcon,
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
import { useFirestoreDocData } from "reactfire";

import Card from "~/components/Card";
import EventProvider, { useEvent } from "~/components/contexts/EventProvider";
import WaiverEditor from "~/components/WaiverEditor";
import WaiverProvider, { useWaiver } from "~/components/WaiverEditor/WaiverProvider";
import { useFormState } from "~/helpers/utils";

const waiver = `# RSO Waiver Form

## Waiver of Liability, Assumption of Risk, and Indemnity Agreement

**Waiver:** In consideration of :field{#participant_name placeholder="Legal Name of Participant"} being permitted to participate in any way in the **2021 Berkeley Math Tournament**, hereinafter called "The Activity," I, for myself, my heirs, personal representatives or assigns, **do hereby release, waive, discharge, and covenant not to sue**

- the **the Math Tournament at Berkeley**, its officers and members;
- and The Regents of the University of California, its officers, employees, and agents

from liability **from any and all claims, including negligence,** that result in personal injury, accidents or illnesses (including death), and property loss arising from, but not limited to, participation in The Activity.

## Signature of Parent/Guardian of Minor

::signature{#parent_sig}

Date: :field{#date}

## Signature of Participant

::signature{#participant_sig}

Date: :field{#date}

**Assumption of Risks:** Participation in The Activity carries with it certain inherent risks that cannot be eliminated regardless of the care taken to avoid injuries. The specific risks vary from one activity to another, but the risks range from 1) minor injuries such as scratches, bruises, and sprains 2) major injuries such as eye injury or loss of sight, joint or back injuries, heart attacks, and concussions 3) catastrophic injuries including paralysis and death.

**I have read the previous paragraphs and I know, understand, and appreciate these and other risks that are inherent in The Activity. I hereby assert that my participation is voluntary and that I knowingly assume all such risks.**

**Indemnification and Hold Harmless:** I also agree to INDEMNIFY AND HOLD the **Math Tournament at Berkeley**, and The Regents of the University of California HARMLESS from any and all claims, actions, suits, procedures, costs, expenses, damages and liabilities, including attorney’s fees brought as a result of my involvement in The Activity and to reimburse them for any such expenses incurred.

**Severability:** The undersigned further expressly agrees that the foregoing waiver and assumption of risks agreement is intended to be as broad and inclusive as is permitted by the law of the State of California and that if any portion thereof is held invalid, it is agreed that the balance shall, notwithstanding, continue in full legal force and effect.

**Acknowledgment of Understanding:** I have read this waiver of liability, assumption of risk, and indemnity agreement, fully understand its terms, and understand that I am giving up substantial rights, including my right to sue. I acknowledge that I am signing the agreement freely and voluntarily, and intend by my signature to be a complete and unconditional release of all liability to the greatest extent allowed by law.

## Signature of Parent/Guardian of Minor

::signature{#parent_sig}

Date: :field{#date}

Participant Age (if minor): :field{#participant_age}

## Signature of Participant

::signature{#participant_sig}

Date: :field{#date}`;

const WaiverConfirmModal = ({ pdf, onCancel, onConfirm }) => {
  const [{ isLoading, error }, wrapAction] = useFormState();

  return (
    <Modal closeOnEsc={false} closeOnOverlayClick={false} isOpen={!!pdf} onClose={onCancel} size="6xl">
      <ModalOverlay />
      <ModalContent height="80%">
        <ModalHeader>Confirm Waiver Submission</ModalHeader>
        <ModalCloseButton />
        <ModalBody height="100%">
          <iframe width="100%" height="100%" src={`${pdf}#toolbar=0`} />
        </ModalBody>

        <ModalFooter>
          {error && (
            <Alert status="error" mr={3}>
              <AlertIcon />
              {error.message}
            </Alert>
          )}

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

const WaiverContent = () => {
  const { values } = useWaiver();
  const [submittedPDF, setSubmittedPDF] = useState();
  const completed = !Object.values(values).includes(null);

  const { studentId } = useRouter().query;

  const { ref: eventRef } = useEvent();
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
      body: JSON.stringify({ waiver, values }),
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
    await studentRef.update({ waiver: submittedPDF });
  };

  if (student.waiver) {
    return (
      <Stack maxW="5xl" height="100vh" mx="auto" p={8} spacing={4}>
        <Alert status="success">
          <AlertIcon />
          The waiver has been submitted. You can view it below.
        </Alert>
        <iframe width="100%" height="100%" src={`${student.waiver}`} />
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
          <WaiverEditor>{waiver}</WaiverEditor>
          <Button type="submit" colorScheme="blue" isDisabled={!completed} isLoading={isLoading}>
            Submit
          </Button>
        </form>
        {submittedPDF && (
          <WaiverConfirmModal
            pdf={submittedPDF}
            onCancel={() => setSubmittedPDF(undefined)}
            onConfirm={handleConfirm}
          />
        )}
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
