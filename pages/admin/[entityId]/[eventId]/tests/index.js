/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Heading,
  HStack,
  IconButton,
  Stack,
  Tag,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import firebase from "firebase";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  HiClipboardCheck,
  HiLockClosed,
  HiLockOpen,
  HiPencilAlt,
  HiSpeakerphone,
  HiTable,
  HiTrash,
} from "react-icons/hi";
import { useFirestoreCollectionData } from "reactfire";
import * as yup from "yup";

import AllowedStudentsModal from "~/components/AllowedStudentsModal";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import FormField from "~/components/FormField";
import AddTestForm from "~/components/forms/AddTestForm";
import { delay, useFormState, useTime } from "~/helpers/utils";

const TooltipLink = ({ label, href, children }) => (
  <Tooltip label={label}>
    <Box>
      <NextLink href={href} passHref>
        {children}
      </NextLink>
    </Box>
  </Tooltip>
);

const AllowedStudentsButton = ({ customFields, customTeamFields, customOrgFields, authorization, testRef }) => {
  const [formState, wrapAction] = useFormState();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [state, setState] = useState(false); // Hack for resetting default value

  const handleSubmit = wrapAction(async ({ isPrivate, mode, rules }) => {
    if (!isPrivate) {
      await testRef.update({ authorization: firebase.firestore.FieldValue.delete() });
    } else {
      await testRef.update({ authorization: { mode, rules } });
    }

    onClose();
    // Hack for resetting default value
    await delay(500);
    setState(!state);
  });

  return (
    <Tooltip label="Edit Test Restrictions">
      <Box>
        <IconButton
          as="a"
          colorScheme={authorization ? "purple" : undefined}
          icon={authorization ? <HiLockClosed /> : <HiLockOpen />}
          onClick={onOpen}
          cursor="pointer"
        />
        <AllowedStudentsModal
          key={state.toString()}
          defaultValues={{ isPrivate: !!authorization, rules: authorization?.rules, mode: authorization?.mode }}
          customFields={customFields}
          customTeamFields={customTeamFields}
          customOrgFields={customOrgFields}
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={handleSubmit}
          {...formState}
        />
      </Box>
    </Tooltip>
  );
};

const schema = yup.object({
  gracePeriod: yup.number().typeError("Invalid number").required().label("Grace Period (seconds)"),
});

const OpenTestModal = ({ type, duration, isOpen, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { gracePeriod: type === "guts" ? 0 : 300 },
    mode: "onTouched",
    resolver: yupResolver(schema),
  });

  const ref = useRef();

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={ref} motionPreset="slideInBottom">
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Open Test
          </AlertDialogHeader>
          <AlertDialogBody>
            <form
              id="open-test-form"
              onSubmit={handleSubmit((values) => {
                onSubmit(values);
                onClose();
              })}
            >
              <Stack spacing={4}>
                <FormField
                  type="number"
                  {...register("gracePeriod")}
                  label="Grace Period (seconds)"
                  placeholder="5"
                  error={errors.gracePeriod}
                  isRequired
                />
                <Box>
                  This will open the test for all eligible students for a window of{" "}
                  <b>{(duration + Number(watch("gracePeriod", 0))) / 60} minutes</b>. Confirm?
                </Box>
              </Stack>
            </form>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={ref} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" form="open-test-form" ml={3}>
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

const TestCard = ({
  id,
  type,
  name,
  team,
  duration,
  authorization,
  customFields,
  customTeamFields,
  customOrgFields,
  testRef,
  openTime: rawOpenTime,
  closeTime: rawCloseTime,
  time,
  onOpen,
  onDelete,
  onCloseTest,
}) => {
  const router = useRouter();
  const { entityId, eventId } = router.query;

  const openTime = rawOpenTime && dayjs(rawOpenTime?.toDate());
  const closeTime = rawCloseTime && dayjs(rawCloseTime?.toDate());
  const open = time.isAfter(openTime) && time.isBefore(closeTime);

  const [openDialog] = useDialog();

  const { isOpen, onOpen: handleOpen, onClose } = useDisclosure();

  const handleDelete = () => {
    openDialog({
      type: "confirm",
      title: "Are you sure?",
      description: "This action cannot be undone.",
      onConfirm: onDelete,
    });
  };

  const handleClose = () => {
    openDialog({
      type: "confirm",
      title: "Are you sure?",
      description: "This will prevent tests from being started, but will not kick out students who are already in.",
      onConfirm: onCloseTest,
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
          {type === "target" && (
            <Tag size="sm" colorScheme="blue">
              Target
            </Tag>
          )}
        </HStack>
        <Text color="gray.500">Duration: {duration / 60} minutes</Text>
        {open && <Text color="red.500">Closes {closeTime.format("MM/DD/YYYY h:mm A")}</Text>}
      </Box>

      <TooltipLink label="Edit Problems" href={`/admin/${entityId}/${eventId}/tests/${id}`}>
        <IconButton as="a" icon={<HiPencilAlt />} />
      </TooltipLink>

      <TooltipLink
        label="Edit Rules and Clarifications"
        href={`/admin/${entityId}/${eventId}/tests/${id}/clarifications`}
      >
        <IconButton as="a" icon={<HiSpeakerphone />} />
      </TooltipLink>

      <TooltipLink label="Grade Tests" href={`/admin/${entityId}/${eventId}/tests/${id}/grade`}>
        <IconButton as="a" icon={<HiClipboardCheck />} />
      </TooltipLink>

      <TooltipLink label="View Results" href={`/admin/${entityId}/${eventId}/tests/${id}/submissions`}>
        <IconButton as="a" icon={<HiTable />} />
      </TooltipLink>

      {open ? (
        <Button colorScheme="teal" onClick={handleClose} minW={150}>
          Close Test
        </Button>
      ) : (
        <Button colorScheme="blue" onClick={handleOpen} minW={150}>
          {openTime ? "Reopen Test" : "Open Test"}
        </Button>
      )}

      <AllowedStudentsButton
        customFields={customFields}
        customTeamFields={customTeamFields}
        customOrgFields={customOrgFields}
        authorization={authorization}
        testRef={testRef}
      />

      <IconButton icon={<HiTrash />} colorScheme="red" onClick={handleDelete} />

      <OpenTestModal isOpen={isOpen} onClose={onClose} onSubmit={onOpen} duration={duration} type={type} />
    </Card>
  );
};

const TestsTab = () => {
  const { data: event, ref: eventRef } = useEvent();
  const time = useTime();

  const testsRef = eventRef.collection("tests");
  const { data: tests } = useFirestoreCollectionData(testsRef, { idField: "id" });
  const [formState, wrapAction] = useFormState();

  tests.sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenTest = (test) => async (values) => {
    const now = dayjs();
    const closeTime = now.add(test.duration, "seconds").add(values.gracePeriod, "seconds");
    await testsRef.doc(test.id).update({
      openTime: firebase.firestore.Timestamp.fromDate(now.toDate()),
      closeTime: firebase.firestore.Timestamp.fromDate(closeTime.toDate()),
    });
  };

  const handleCloseTest = (test) => async (values) => {
    const now = dayjs();
    await testsRef.doc(test.id).update({
      closeTime: firebase.firestore.Timestamp.fromDate(now.toDate()),
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
      {tests.map((x) => (
        <TestCard
          key={x.id}
          {...x}
          customFields={event.customFields ?? []}
          customTeamFields={event.customTeamFields ?? []}
          customOrgFields={event.customOrgFields ?? []}
          time={time}
          testRef={testsRef.doc(x.id)}
          onOpen={handleOpenTest(x)}
          onDelete={handleDeleteTest(x)}
          onCloseTest={handleCloseTest(x)}
        />
      ))}
      <Card as={Stack} spacing={4} p={4} maxW="md">
        <Heading size="md">Add Test</Heading>
        <AddTestForm buttonText="Add Test" onSubmit={handleAddTest} {...formState} />
      </Card>
    </Stack>
  );
};

export default TestsTab;
