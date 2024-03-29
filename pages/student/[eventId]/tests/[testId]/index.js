/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  chakra,
  Collapse,
  Heading,
  Icon,
  Input,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import TeX from "@matejmazur/react-katex";
import dayjs from "dayjs";
import firebase from "firebase";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { HiCheckCircle } from "react-icons/hi";
import { Sticky } from "react-sticky";
import { useFirestoreDocData, useUser } from "reactfire";

import MathJax from "~/components/MathJax";
import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import AsciiMathParser from "~/helpers/asciimath2tex";
import { useFormState, useTime } from "~/helpers/utils";

const parser = new AsciiMathParser();

const Problem = ({ test, text, idx, submission, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [{ isLoading, error }, wrapAction] = useFormState();

  const rendered = value && parser.parse(value);

  const handleUpdate = wrapAction(async () => {
    if (value === text) return;
    await onUpdate(value ?? "", rendered ?? "");
    setEditing(false);
  });

  useEffect(() => {
    if (!editing) {
      setValue(submission);
    }
  }, [submission]);

  return (
    <Card as={Stack} p={4} spacing={4} flex={1}>
      {test.type !== "target" && <Heading size="md">Problem {idx + 1}</Heading>}
      <MathJax math={text} config={{ menuSettings: { inTabOrder: false } }} />

      <Input
        fontFamily="mono"
        value={value ?? ""}
        onChange={(e) => {
          setValue(e.target.value);
          setEditing(true);
        }}
        onBlur={handleUpdate}
        placeholder="0"
      />

      {rendered && <TeX math={rendered} />}

      {isLoading && (
        <Text color="yellow.500" fontSize="sm">
          Saving...
        </Text>
      )}
      {!isLoading && !error && submission && (
        <Text color="green.500" fontSize="sm">
          Saved:{" "}
          <chakra.span fontFamily="mono" fontSize>
            {submission}
          </chakra.span>
        </Text>
      )}
      {error && (
        <Text color="red.500" fontSize="sm">
          Error: {error.message}
        </Text>
      )}
    </Card>
  );
};

const TestTimer = ({ time, endTime, target = false }) => {
  const timeRemaining = dayjs.duration(Math.max(endTime.diff(time) - 2000, 0));
  const mins = timeRemaining.asMinutes();
  const color = mins < 1 ? "red" : mins < 5 ? "orange" : "blue";

  return (
    <Alert size="xl" colorScheme={color}>
      <AlertIcon />
      <AlertTitle>{target ? "This Set" : "Time Remaining"}</AlertTitle>
      <AlertDescription>{timeRemaining.format("HH:mm:ss")}</AlertDescription>
    </Alert>
  );
};

const TestContent = () => {
  const {
    ref: testRef,
    data: test,
    problemsData: { problems = [] },
  } = useTest();

  const { eventId } = useRouter().query;
  const { ref: eventRef } = useEvent();
  const { data: user } = useUser();
  const time = useTime();

  const studentRef = eventRef.collection("students").doc(user.uid);
  const { data: student } = useFirestoreDocData(studentRef);

  const submissionId = test.team ? student.team.id : user.uid;
  const submissionRef = testRef.collection("submissions").doc(submissionId);
  const { data: submission } = useFirestoreDocData(submissionRef);
  const startTime = dayjs(submission.startTime.toDate());
  const endTime = dayjs(submission.endTime.toDate());
  let numSets;
  let set;
  let nextSetTime;

  let displayProblems = problems.map((x, idx) => [x, idx]);

  if (test.type === "guts") {
    set = submission.gutsSet ?? 0;
    displayProblems = displayProblems.slice(test.numPerSet * set, test.numPerSet * (set + 1));
  }

  if (test.type === "target") {
    numSets = Math.ceil(problems.length / test.numPerSet);
    const timePerSet = (test.duration / numSets) * 1000;
    const setsRemaining = Math.floor(endTime.diff(time) / timePerSet);
    set = numSets - setsRemaining - 1;
    nextSetTime = endTime.subtract(timePerSet * setsRemaining, "milliseconds");
    displayProblems = displayProblems.slice(test.numPerSet * set, test.numPerSet * (set + 1));
  }

  useEffect(() => {
    if (test.type !== "target") return;
    if (set <= 0 || set >= numSets) return;
    openDialog({
      type: "alert",
      title: "Next Submission",
      description: `You have moved onto Submission ${set + 1}.`,
    });
  }, [set]);

  const handleUpdate = async (update) => {
    await submissionRef.update(update);
  };

  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  // Guts

  const [openDialog, closeDialog] = useDialog();
  const [dialog, setDialog] = useState(null);
  useEffect(() => {
    if (dialog !== null) {
      closeDialog(dialog);
    }
  }, [submission.gutsSet]);

  if (!submission.startTime) {
    return (
      <Alert status="error">
        <AlertIcon />
        Submission Not Found
      </Alert>
    );
  }

  const handleNextSet = () => {
    setDialog(
      openDialog({
        type: "confirm",
        title: "Are you sure?",
        description: "Once you move onto the next set, you cannot return.",
        onConfirm: () => handleUpdate({ gutsSet: (submission.gutsSet ?? 0) + 1 }),
      })
    );
  };

  if (time.isAfter(endTime)) {
    return (
      <VStack spacing={4}>
        <VStack>
          <Icon as={HiCheckCircle} boxSize={128} />
          <Heading>Time&apos;s up!</Heading>
          <Text>Your answers were submitted.</Text>
        </VStack>
        <ButtonLink href={`/student/${eventId}/tests`} size="sm" colorScheme="blue">
          Back to Tests
        </ButtonLink>
      </VStack>
    );
  }

  if (displayProblems.length == 0) {
    return (
      <VStack spacing={4}>
        <VStack>
          <Icon as={HiCheckCircle} boxSize={128} />
          <Heading>You&apos;re done!</Heading>
          <Text>You have completed all sets.</Text>
        </VStack>
        <ButtonLink href={`/student/${eventId}/tests`} size="sm" colorScheme="blue">
          Back to Tests
        </ButtonLink>
      </VStack>
    );
  }

  return (
    <Stack direction="row" spacing={4}>
      <Stack spacing={4} flex={1}>
        <Heading size="lg">
          {test.name}
          {test.type == "guts" && ` (Set ${(submission.gutsSet ?? 0) + 1})`}
          {test.type == "target" && ` (Submission ${(set ?? 0) + 1})`}
        </Heading>

        {test.rules && (
          <Card as={Stack} spacing={0} p={4} onClick={onToggle} cursor="pointer" position="relative">
            <Heading size="md">Round Rules</Heading>
            <Collapse in={isOpen} animateOpacity>
              <Box mt={4}>
                <MathJax math={test.rules} />
              </Box>
            </Collapse>
            <Text fontSize="xs" color="gray.500" position="absolute" bottom={2} right={2}>
              Click to {isOpen ? "collapse" : "expand"}
            </Text>
          </Card>
        )}

        {displayProblems.map(([x, idx]) => (
          <Problem
            test={test}
            key={idx}
            idx={idx}
            text={x}
            submission={submission?.[idx]}
            onUpdate={(val, rendered) =>
              handleUpdate({
                [idx]: val || firebase.firestore.FieldValue.delete(),
                [`${idx}r`]: rendered || firebase.firestore.FieldValue.delete(),
                [`${idx}t`]: firebase.firestore.FieldValue.serverTimestamp(),
              })
            }
          />
        ))}

        {test.type == "guts" && (
          <Button colorScheme="blue" onClick={handleNextSet} alignSelf="flex-start">
            Next Set
          </Button>
        )}
      </Stack>

      <Stack flexBasis={300} flexShrink={0} spacing={4} style={{ marginTop: "-1rem" }}>
        <Sticky relative>
          {({ style }) => (
            <Stack spacing={4} mt={4} {...style}>
              <TestTimer time={time} endTime={endTime} />
              {test.type === "target" && <TestTimer time={time} endTime={nextSetTime} target />}

              <Card as={Stack} spacing={4} p={4}>
                <Heading size="md">Clarifications</Heading>
                <MathJax math={test.clarifications ?? "None at this time."} />
              </Card>
            </Stack>
          )}
        </Sticky>
      </Stack>
    </Stack>
  );
};

const Test = () => (
  <TestProvider>
    <TestContent />
  </TestProvider>
);

export default Test;

Test.layoutProps = {
  maxW: 2000,
};
