/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import minMax from "dayjs/plugin/minMax";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { HiCheck } from "react-icons/hi";
import { useAuth, useFirestoreCollectionData, useFirestoreDoc, useFirestoreDocData, useUser } from "reactfire";

import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import { toDict, useFormState, useTime } from "~/helpers/utils";

dayjs.extend(relativeTime);
dayjs.extend(minMax);
dayjs.extend(duration);

const TestCard = ({
  eventId,
  id,
  name,
  team,
  duration,
  onStart,
  isLoading,
  student,
  time,
  openTime,
  closeTime,
  waiting,
  resultsReleased,
}) => {
  const [openDialog] = useDialog();
  const { ref: eventRef } = useEvent();

  const sid = team ? student.team.id : student.id;
  const submissionRef = eventRef.collection("tests").doc(id).collection("submissions").doc(sid);
  const { data: submission } = useFirestoreDoc(submissionRef);

  const handleClick = () => {
    if (submission.exists) {
      return onStart();
    }

    const endTime = dayjs.min(dayjs.unix(closeTime.seconds), time.add(duration, "seconds"));
    const dur = dayjs.duration(endTime.diff(time));

    const description = `
        By starting the test, your timer will begin. You will have
        <b style="color: red;">${dur.humanize()}</b> to complete the test.
        Please ensure you are ready.
      `;

    if (team) description = description.replace("your timer will begin", "your timer will begin for the entire team");

    if (dur.asSeconds() < duration / 2) {
      description += `
          <br><br><b style="color: red;">
            The testing window is already more than halfway over.
            Please double check to make sure you are testing in the intended window.
          </b>
        `;
    }

    openDialog({
      type: "confirm",
      title: "Are you sure?",
      description,
      onConfirm: onStart,
    });
  };

  const open = openTime && closeTime && openTime.toDate() < time.toDate() && time.toDate() < closeTime.toDate();
  let children = "";
  let order = 0;

  if (submission.exists) {
    if (time.toDate() > submission.data().endTime.toDate()) {
      if (resultsReleased) {
        order = 200;
        children = (
          <ButtonLink
            href={`/student/${eventId}/tests/${id}/results`}
            size="sm"
            colorScheme="blue"
            isLoading={isLoading === id}
          >
            View Results
          </ButtonLink>
        );
      } else {
        order = 100;
        children = <Icon as={HiCheck} color="green.500" fontSize="2xl" />;
      }
    } else {
      order = -200;
      children = (
        <Button size="sm" colorScheme="blue" onClick={handleClick} isLoading={isLoading === id}>
          Resume
        </Button>
      );
    }
  } else if (waiting) {
    order = -50;
    children = (
      <Button size="sm" disabled>
        Waiting
      </Button>
    );
  } else if (!open) {
    order = 50;
    children = (
      <Button size="sm" disabled>
        Not Open
      </Button>
    );
  } else {
    order = -100;
    children = (
      <Button size="sm" colorScheme="blue" onClick={handleClick} isLoading={isLoading === id}>
        Start
      </Button>
    );
  }

  return (
    <Card as={HStack} p={3} my={2} key={id} order={order}>
      <Box flex="1">
        <Heading size="sm">{name}</Heading>
        <Text color="gray.500" fontSize="sm">
          Duration: {duration / 60} minutes
        </Text>
      </Box>
      {children}
    </Card>
  );
};

const TestSelection = ({
  testsById,
  testSelection,
  testSelectionDescription,
  currentSelection,
  testSelectionMax,
  disabled,
  onUpdate,
}) => {
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
      {testSelectionDescription && <Text>{testSelectionDescription}</Text>}
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
  tests.sort((a, b) => a.name.localeCompare(b.name));
  const testsById = tests.reduce(toDict, {});

  let displayTests = tests.filter(
    (x) =>
      !x.authorizedIds ||
      x.authorizedIds.includes(student.id) ||
      (student.number && x.authorizedIds.includes(student.number))
  );

  if (!event.teamsEnabled) {
    displayTests = displayTests.filter((x) => !x.team);
  }

  // Test Selection

  if (event.testSelection) {
    const indivTests = Object.keys(event.testSelection);
    displayTests = displayTests.filter((x) => !indivTests.includes(x.id) || student.testSelection?.includes(x.id));

    const waiting = false;

    if (event.forceAlphabetical) {
      for (const x of displayTests) {
        const open =
          x.openTime && x.closeTime && x.openTime.toDate() < time.toDate() && time.toDate() < x.closeTime.toDate();
        if (!indivTests.includes(x.id)) continue;
        if (!open) continue;

        x.waiting = waiting;

        waiting = true;
        if (student.startedSelected && x.id === student.startedSelected) {
          waiting = false;
        }
      }
    }
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
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch(`/api/student/${event.id}/tests/${testId}/start`, {
      method: "POST",
      headers: { authorization },
    });
    if (!resp.ok) throw new Error(await resp.text());
    router.push(`/student/${event.id}/tests/${testId}`);
  });

  // Waiver
  if (event.teamsEnabled && !student.team) {
    return (
      <>
        <Alert status="error">
          <AlertIcon />
          You must be in a team to take tests.
        </Alert>

        <ButtonLink href={`/student/${event.id}`} colorScheme="blue" alignSelf="flex-start">
          Back to {event.name}
        </ButtonLink>
      </>
    );
  }

  if (event.waiver && !student.waiver && !student.waiverSigned) {
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
          testSelectionDescription={event.testSelectionDescription}
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

          {displayTests.length > 0 && (
            <Flex flexDir="column" style={{ marginTop: "0.5rem", marginBottom: "-0.5rem" }}>
              {displayTests.map((x) => (
                <TestCard
                  key={x.id}
                  eventId={event.id}
                  {...x}
                  onStart={() => handleStartTest(x.id)}
                  isLoading={isLoading}
                  student={student}
                  time={time}
                />
              ))}
            </Flex>
          )}
        </>
      )}

      <ButtonLink href={`/student/${event.id}`} colorScheme="blue" alignSelf="flex-start">
        Back to {event.name}
      </ButtonLink>
    </Stack>
  );
};

export default Tests;
