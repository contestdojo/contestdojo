/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Box, Button, Checkbox, Divider, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import minMax from "dayjs/plugin/minMax";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth, useFirestoreCollectionData, useFirestoreDoc, useFirestoreDocData, useUser } from "reactfire";

import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import { toDict, useFormState, useTime } from "~/helpers/utils";

dayjs.extend(minMax);
dayjs.extend(duration);

const TestCard = ({ id, name, team, duration, onStart, isLoading, student, time, closeTime }) => {
  const [openDialog] = useDialog();
  const { ref: eventRef } = useEvent();

  const sid = team ? student.team.id : student.id;
  const submissionRef = eventRef.collection("tests").doc(id).collection("submissions").doc(sid);
  const { data: submission } = useFirestoreDoc(submissionRef);

  const endTime = dayjs.min(dayjs.unix(closeTime.seconds), time.add(duration, "seconds"));
  const dur = dayjs.duration(endTime.diff(time));
  const mins = dur.asMinutes().toFixed(0);

  const handleClick = () => {
    if (submission.exists) {
      onStart();
    } else {
      openDialog({
        type: "confirm",
        title: "Are you sure?",
        description: team
          ? `By starting the test, your timer will begin for the entire team. You will have ${mins} minutes to complete the test. Please communicate with your team members to ensure you are ready.`
          : `By starting the test, your timer will begin. You will have ${mins} minutes to complete the test. Please ensure you are ready.`,
        onConfirm: onStart,
      });
    }
  };

  let finished = false;
  if (submission.exists) {
    const endTime = dayjs(submission.data().endTime.toDate());
    finished = time.isAfter(endTime);
  }

  return (
    <Card as={HStack} p={4} key={id}>
      <Box flex="1">
        <Heading size="md">{name}</Heading>
        <Text color="gray.500">Duration: {duration / 60} minutes</Text>
      </Box>
      <Button colorScheme="blue" onClick={handleClick} isLoading={isLoading === id} disabled={finished}>
        {finished ? "Submitted" : submission.exists ? "Resume" : "Start"}
      </Button>
    </Card>
  );
};

const TestSelection = ({ testsById, testSelection, currentSelection, testSelectionMax, disabled, onUpdate }) => {
  const [formState, wrapAction] = useFormState();
  const [edited, setEdited] = useState(false);
  const [selection, setSelection] = useState({});
  const totalWeight = Object.entries(selection)
    .filter(([, x]) => x)
    .map(([x]) => testSelection[x])
    .reduce((a, b) => a + b, 0);

  useEffect(() => {
    setSelection(Object.fromEntries(currentSelection?.map((x) => [x, true]) ?? []));
  }, [currentSelection]);

  const handleChange = (id) => (e) => {
    if (e.target.checked && totalWeight + testSelection[id] > testSelectionMax) return;
    const newSelection = { ...selection };
    if (e.target.checked) newSelection[id] = true;
    else delete newSelection[id];
    setSelection(newSelection);
    setEdited(true);
  };

  const sortedEntries = Object.entries(testSelection);
  sortedEntries.sort(([, a], [, b]) => b - a);

  return (
    <Stack spacing={4}>
      <Heading size="lg">Test Selection</Heading>
      <Text>
        This contest requires you to select events to participate in before you can begin testing. Please fill{" "}
        <b>{testSelectionMax}</b> slots from the choices below. You may modify your selection any time before you begin
        your first test.
      </Text>
      {formState.error && (
        <Alert status="error">
          <AlertIcon />
          {formState.error.message}
        </Alert>
      )}
      <Stack>
        {sortedEntries.map(([id, weight]) => (
          <Checkbox
            key={id}
            colorScheme="blue"
            isChecked={!!selection[id]}
            onChange={handleChange(id)}
            isDisabled={disabled || (!selection[id] && totalWeight + weight > testSelectionMax)}
          >
            {testsById[id].name}
            {weight !== 1 && <> ({weight} slots)</>}
          </Checkbox>
        ))}
      </Stack>
      {edited && (
        <Button
          colorScheme="blue"
          alignSelf="flex-start"
          isLoading={formState.isLoading}
          onClick={() => wrapAction(onUpdate, () => setEdited(false))(selection)}
          isDisabled={totalWeight !== testSelectionMax}
        >
          Save Selection
        </Button>
      )}
      <Divider />
    </Stack>
  );
};

const Tests = () => {
  const { data: user } = useUser();
  const { ref: eventRef, data: event } = useEvent();
  const router = useRouter();
  const auth = useAuth();
  const time = useTime();

  const studentRef = eventRef.collection("students").doc(user.uid);
  const { data: student } = useFirestoreDocData(studentRef, { idField: "id" });

  const testsRef = eventRef.collection("tests");
  const { data: tests } = useFirestoreCollectionData(testsRef, { idField: "id" });
  const testsById = tests.reduce(toDict, {});

  let displayTests = tests.filter(
    (x) =>
      x.openTime &&
      !x.hide &&
      x.openTime.toDate() < time.toDate() &&
      time.toDate() < x.closeTime.toDate() &&
      (!x.authorizedIds || x.authorizedIds.includes(student.id))
  );

  // Test Selection

  if (event.testSelection) {
    const indivTests = Object.keys(event.testSelection);
    displayTests = displayTests.filter((x) => !indivTests.includes(x.id) || student.testSelection?.includes(x.id));
  }

  const handleTestSelectionUpdate = async (selection) => {
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch(`/api/student/set_test_selection`, {
      method: "POST",
      headers: { authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, selection: Object.keys(selection) }),
    });
    if (!resp.ok) throw new Error(await resp.text());
  };

  // Start Test

  const [{ isLoading, error }, wrapAction] = useFormState({ multiple: true });

  const handleStartTest = wrapAction(async (testId) => {
    console.log(testId);
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch(`/api/student/${event.id}/tests/${testId}/start`, {
      method: "POST",
      headers: { authorization },
    });
    if (!resp.ok) throw new Error(await resp.text());
    router.push(`/student/${event.id}/tests/${testId}`);
  });

  // Waiver

  if (event.waiver && !student.waiver) {
    return (
      <>
        <Alert status="error">
          <AlertIcon />
          You must complete your waiver prior to taking tests.
        </Alert>

        <ButtonLink href={`/student/${event.id}`} colorScheme="blue" alignSelf="flex-start">
          Back to {event.name}
        </ButtonLink>
      </>
    );
  }

  return (
    <Stack spacing={4} maxW={600} mx="auto">
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error.message}
        </Alert>
      )}

      {event.testSelection && (
        <TestSelection
          testSelection={event.testSelection}
          currentSelection={student.testSelection}
          testSelectionMax={event.testSelectionMax ?? 0}
          testsById={testsById}
          disabled={!!student.startedSelected}
          onUpdate={handleTestSelectionUpdate}
        />
      )}

      {(!event.testSelection || student.testSelection) && (
        <>
          <Text>
            {displayTests.length === 0
              ? "You do not have any available tests at the moment."
              : "The following tests are available for you to take:"}
          </Text>

          {displayTests.map((x) => (
            <TestCard
              key={x.id}
              {...x}
              onStart={() => handleStartTest(x.id)}
              isLoading={isLoading}
              student={student}
              time={time}
            />
          ))}
        </>
      )}

      <ButtonLink href={`/student/${event.id}`} colorScheme="blue" alignSelf="flex-start">
        Back to {event.name}
      </ButtonLink>
    </Stack>
  );
};

export default Tests;
