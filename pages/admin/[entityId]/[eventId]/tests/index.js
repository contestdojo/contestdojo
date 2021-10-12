/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Box, Button, Heading, HStack, IconButton, Stack, Tag, Text, Tooltip } from "@chakra-ui/react";
import dayjs from "dayjs";
import firebase from "firebase";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { HiClipboardCheck, HiPencilAlt, HiSpeakerphone, HiTable, HiTrash } from "react-icons/hi";
import { useFirestoreCollectionData } from "reactfire";

import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import AddTestForm from "~/components/forms/AddTestForm";
import { toDict, useFormState, useTime } from "~/helpers/utils";

const TooltipLink = ({ label, href, children }) => (
  <Tooltip label={label}>
    <Box>
      <NextLink href={href} passHref>
        {children}
      </NextLink>
    </Box>
  </Tooltip>
);

const TestCard = ({
  id,
  type,
  name,
  team,
  duration,
  openTime: rawOpenTime,
  closeTime: rawCloseTime,
  time,
  onOpen,
  onDelete,
}) => {
  const router = useRouter();
  const { entityId, eventId } = router.query;

  const openTime = rawOpenTime && dayjs(rawOpenTime?.toDate());
  const closeTime = rawCloseTime && dayjs(rawCloseTime?.toDate());
  const open = time.isAfter(openTime) && time.isBefore(closeTime);

  const [openDialog] = useDialog();

  const handleOpen = () => {
    openDialog({
      type: "confirm",
      title: "Are you sure?",
      description: `This will open the test for all students for a window of ${
        duration / 60 + (type === "guts" ? 0 : 5)
      } minutes. Confirm?`,
      onConfirm: onOpen,
    });
  };

  const handleDelete = () => {
    openDialog({
      type: "confirm",
      title: "Are you sure?",
      description: "This action cannot be undone.",
      onConfirm: onDelete,
    });
  };

  return (
    <Card as={HStack} p={4} key={id}>
      <Box flex="1">
        <HStack>
          <Heading size="md">{name}</Heading>
          {team && (
            <Tag size="sm" colorScheme="blue">
              Team
            </Tag>
          )}
          {type === "guts" && (
            <Tag size="sm" colorScheme="blue">
              Guts
            </Tag>
          )}
        </HStack>
        <Text color="gray.500">Duration: {duration / 60} minutes</Text>
        {open && <Text color="red.500">Closes {closeTime.format("MM/DD/YYYY h:mm A")}</Text>}
      </Box>

      <TooltipLink label="Edit Problems" href={`/admin/${entityId}/${eventId}/tests/${id}`}>
        <IconButton as="a" icon={<HiPencilAlt />} />
      </TooltipLink>

      <TooltipLink label="Edit Clarifications" href={`/admin/${entityId}/${eventId}/tests/${id}/clarifications`}>
        <IconButton as="a" icon={<HiSpeakerphone />} />
      </TooltipLink>

      <TooltipLink label="Grade Tests" href={`/admin/${entityId}/${eventId}/tests/${id}/grade`}>
        <IconButton as="a" icon={<HiClipboardCheck />} />
      </TooltipLink>

      <TooltipLink label="View Results" href={`/admin/${entityId}/${eventId}/tests/${id}/submissions`}>
        <IconButton as="a" icon={<HiTable />} />
      </TooltipLink>

      <Button colorScheme="blue" onClick={handleOpen} minW={150} disabled={open}>
        {open ? "Open" : openTime ? "Reopen Test" : "Open Test"}
      </Button>

      <IconButton icon={<HiTrash />} colorScheme="red" onClick={handleDelete} />
    </Card>
  );
};

const TestsTab = () => {
  const { ref: eventRef } = useEvent();
  const time = useTime();

  const testsRef = eventRef.collection("tests");
  const { data: tests } = useFirestoreCollectionData(testsRef, { idField: "id" });
  let testsById = tests.reduce(toDict, {});
  const [formState, wrapAction] = useFormState();

  const handleOpenTest = (test) => async () => {
    const now = dayjs();
    const closeTime = now.add(test.duration, "seconds").add(test.type === "guts" ? 0 : 5, "minutes");
    await testsRef.doc(test.id).update({
      openTime: firebase.firestore.Timestamp.fromDate(now.toDate()),
      closeTime: firebase.firestore.Timestamp.fromDate(closeTime.toDate()),
    });
  };

  const handleDeleteTest = (test) => async () => {
    await testsRef.doc(test.id).delete();
  };

  const handleAddTest = wrapAction(async ({ name, type, duration, team, numPerSet }) => {
    await testsRef.add({
      name,
      type,
      duration,
      team,
      ...(numPerSet ? { numPerSet } : {}),
    });
  });

  return (
    <Stack spacing={4}>
      {Object.values(testsById).map((x) => (
        <TestCard key={x.id} {...x} time={time} onOpen={handleOpenTest(x)} onDelete={handleDeleteTest(x)} />
      ))}
      <Card as={Stack} spacing={4} p={4} maxW="md">
        <Heading size="md">Add Test</Heading>
        <AddTestForm buttonText="Add Test" onSubmit={handleAddTest} {...formState} />
      </Card>
    </Stack>
  );
};

export default TestsTab;
