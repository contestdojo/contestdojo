/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Editable,
  EditableInput,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/router";
import { HiClipboardCheck, HiDotsHorizontal, HiExclamation, HiTrash } from "react-icons/hi";
import { useAuth, useFirestore, useFirestoreCollectionData, useFirestoreDocData, useUser } from "reactfire";

import AddStudentModal from "~/components/AddStudentModal";
import AddTeamModal from "~/components/AddTeamModal";
import BlankCard from "~/components/BlankCard";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import EventProvider, { useEvent } from "~/components/contexts/EventProvider";
import OrgProvider, { useOrg } from "~/components/contexts/OrgProvider";
import Markdown from "~/components/Markdown";
import PurchaseSeatsModal from "~/components/PurchaseSeatsModal";
import StyledEditablePreview from "~/components/StyledEditablePreview";
import { toDict, useFormState } from "~/helpers/utils";


const StudentCard = ({ id, fname, lname, email, waiver }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const props = transform
    ? { cursor: "grabbing", shadow: "xl", transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : { cursor: "grab" };

  return (
    <Card
      as={Stack}
      spacing={0}
      my={1}
      mx={2}
      p={2}
      position="relative"
      ref={setNodeRef}
      {...props}
      {...listeners}
      {...attributes}
    >
      <Heading as="h4" size="sm">
        {fname} {lname}
      </Heading>
      <Text fontSize="sm">{email}</Text>
      <Box position="absolute" top={2} right={2} lineHeight={1}>
        {waiver ? (
          <Tooltip label="Waiver Signed">
            <span>
              <Icon as={HiClipboardCheck} color="green.500" />
            </span>
          </Tooltip>
        ) : (
          <Tooltip label="Waiver Missing">
            <span>
              <Icon as={HiExclamation} color="red.500" />
            </span>
          </Tooltip>
        )}
      </Box>
    </Card>
  );
};

const TeamCard = ({ id, name, number, students, onUpdate, onDelete, needSeats }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  const props = { backgroundColor: isOver ? "gray.100" : undefined };

  return (
    <Card as={Stack} spacing={0} flex={1} p={2} minHeight="xs" transition="background-color 0.1s" {...props}>
      <HStack px={2}>
        {number && <Text color="gray.500">{number}</Text>}
        <Heading as="h4" size="md" position="relative" flex="1">
          <Editable defaultValue={name} onSubmit={(name) => onUpdate({ name })}>
            <StyledEditablePreview />
            <EditableInput />
          </Editable>
        </Heading>

        <Menu>
          <MenuButton as={IconButton} icon={<HiDotsHorizontal />} variant="ghost" rounded="full" mr={-2}></MenuButton>
          <MenuList>
            <MenuItem icon={<HiTrash />} color="red.500" onClick={onDelete}>
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      <Flex direction="column" flex={1} ref={setNodeRef}>
        {students.map((x) => (
          <StudentCard key={x.id} {...x} />
        ))}
        {students.length === 0 &&
          (needSeats ? <BlankCard>More seats required</BlankCard> : <BlankCard>Drag students here</BlankCard>)}
      </Flex>
    </Card>
  );
};

const PurchaseSeats = ({ stripeAccount }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formState, wrapAction] = useFormState();
  const { orgId, eventId } = useRouter().query;
  const { data: user } = useUser();
  const auth = useAuth();

  const handlePurchaseSeats = wrapAction(async (values) => {
    const number = Number(values.number);
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch(`/api/coach/${orgId}/${eventId}/purchase-seats`, {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, number }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();

    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY, { stripeAccount });

    const stripe = await stripePromise;
    const result = await stripe.redirectToCheckout({
      sessionId: data.id,
    });

    if (result.error) throw new Error(result.error.message);

    onClose();
  });

  return (
    <>
      <Button colorScheme="blue" onClick={onOpen} isDisabled>
        Purchase Seats
      </Button>
      <PurchaseSeatsModal isOpen={isOpen} onClose={onClose} onSubmit={handlePurchaseSeats} {...formState} />
    </>
  );
};

const Teams = ({
  title,
  maxTeams,
  teams,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  studentsByTeam,
  costPerStudent,
  maxStudents,
  seatsRemaining,
  stripeAccount,
}) => {
  const { data: event } = useEvent();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formState, wrapAction] = useFormState();

  const handleAddTeam = wrapAction(async (values) => {
    await onAddTeam(values);
    onClose();
  });

  return (
    <Stack spacing={4}>
      {event.description && (
        <>
          <Box mb={-4}>
            <Markdown>{event.description}</Markdown>
          </Box>
          <Divider />
        </>
      )}
      <Heading size="lg">{title ?? "Teams"}</Heading>
      <p>
        Click the &ldquo;Add Team&rdquo; button to create a new team.
        {costPerStudent > 0 && (
          <>
            {" "}
            Before you can add students to teams, you must purchase seats. Each seat currently costs{" "}
            <b>${costPerStudent} USD</b>. {event.costDescription ?? ""}
          </>
        )}
      </p>
      {costPerStudent > 0 && (
        <p>
          You have currently paid for <b>{maxStudents}</b> seats, with <b>{seatsRemaining}</b> seats remaining. Seats
          are not associated with any particular student, and unassigned students do not use a seat.
        </p>
      )}
      {teams.length > 0 && (
        <SimpleGrid columns={{ sm: 1, lg: 2, xl: 3 }} spacing={4}>
          {teams.map((x) => (
            <TeamCard
              key={x.id}
              onUpdate={(update) => onUpdateTeam(x.id, update)}
              onDelete={() => onDeleteTeam(x.id)}
              {...x}
              students={studentsByTeam[x.id] ?? []}
              needSeats={costPerStudent > 0 && seatsRemaining === 0}
            />
          ))}
        </SimpleGrid>
      )}
      <ButtonGroup>
        {teams.length < (maxTeams ?? 100) ? (
          <Button colorScheme="blue" alignSelf="flex-start" onClick={onOpen}>
            Add Team
          </Button>
        ) : (
          <Tooltip label="You may not add more teams.">
            <Box>
              <Button colorScheme="blue" disabled>
                Add Team
              </Button>
            </Box>
          </Tooltip>
        )}
        {costPerStudent && <PurchaseSeats stripeAccount={stripeAccount} />}
      </ButtonGroup>
      <AddTeamModal isOpen={isOpen} onClose={onClose} onSubmit={handleAddTeam} {...formState} />
    </Stack>
  );
};

const Students = ({ students, onAddStudent }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formState, wrapAction] = useFormState();

  const handleAddStudent = wrapAction(async (values) => {
    await onAddStudent(values);
    onClose();
  });

  // Unassigned droppable
  const { isOver, setNodeRef } = useDroppable({ id: "unassigned" });
  const props = {
    backgroundColor: isOver ? "gray.100" : undefined,
  };

  return (
    <Stack spacing={4}>
      <Heading size="lg">Unassigned Students</Heading>
      <p>
        Once you add a student to your team, they will receive an email invitation to create an account on our website.
        If a student already has an account from a previous tournament (such as the Stanford Math Tournament), they will
        receive an email letting them know to reuse that same account.
      </p>
      <Wrap
        spacing={0}
        style={students.length === 0 ? {} : { marginLeft: "-0.5rem", marginRight: "-0.5rem" }}
        transition="background-color 0.1s"
        borderRadius={4}
        ref={setNodeRef}
        {...props}
      >
        {students.map((x) => (
          <WrapItem key={x.id}>
            <StudentCard {...x} width={300} />
          </WrapItem>
        ))}
        {students.length === 0 && <BlankCard>Drag students here</BlankCard>}
      </Wrap>

      <Button colorScheme="blue" alignSelf="flex-start" onClick={onOpen}>
        Invite Student
      </Button>
      <AddStudentModal isOpen={isOpen} onClose={onClose} onSubmit={handleAddStudent} {...formState} />
    </Stack>
  );
};

const TeamsContent = () => {
  // Functions
  const firestore = useFirestore();
  const auth = useAuth();

  // Data
  const { ref: orgRef, data: org } = useOrg();
  const { ref: eventRef, data: event } = useEvent();

  // Get entity
  const { data: entity } = useFirestoreDocData(event.owner);

  // Get students
  const eventOrgRef = eventRef.collection("orgs").doc(orgRef.id);
  const { data: eventOrg } = useFirestoreDocData(eventOrgRef);

  // Get teams
  const teamsRef = eventRef.collection("teams");
  const { data: teams } = useFirestoreCollectionData(teamsRef.where("org", "==", orgRef), { idField: "id" });

  // Get students
  const studentsRef = eventRef.collection("students");
  const { data: students } = useFirestoreCollectionData(studentsRef.where("org", "==", orgRef), { idField: "id" });

  // Collapse into dict
  const studentsById = students.reduce(toDict, {});

  // Collapse into dict
  const studentsByTeam = {};
  for (const student of students) {
    const key = student.team?.id ?? null;
    if (!studentsByTeam.hasOwnProperty(key)) studentsByTeam[key] = [];
    studentsByTeam[key].push(student);
  }

  // Calculate seats remaining
  const seatsRemaining = (eventOrg?.maxStudents ?? 0) - students.length + (studentsByTeam[null]?.length ?? 0);

  // Dialog
  const [openDialog] = useDialog();

  const handleAddTeam = async ({ name }) => {
    await eventOrgRef.set({}, { merge: true });
    await teamsRef.add({ name: name, org: orgRef });
  };

  const handleUpdateTeam = async (id, update) => {
    await teamsRef.doc(id).update(update);
  };

  const handleDeleteTeam = async (id) => {
    const batch = firestore.batch();
    for (const student of studentsByTeam[id] ?? []) {
      batch.update(studentsRef.doc(student.id), { team: null });
    }
    batch.delete(teamsRef.doc(id));
    await batch.commit();
  };

  const handleAddStudent = async (values) => {
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch(`/api/coach/new-student`, {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!resp.ok) throw new Error(await resp.text());

    const { existed, uid, fname, lname, email } = await resp.json();

    const studentRef = studentsRef.doc(uid);
    const snap = await studentRef.get();
    if (snap.exists) throw new Error("This student is already associated with an organization.");

    await studentRef.set({
      fname,
      lname,
      email,
      grade: values.grade,
      user: firestore.collection("users").doc(uid),
      org: orgRef,
    });

    if (!existed) {
      openDialog({
        type: "alert",
        title: "Student Invited",
        description: "Created a new student account. An email has been sent to the student containing login details.",
      });
    }
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    if (studentsById[active.id].team === null && event.costPerStudent && seatsRemaining === 0) return;
    if (
      over.id !== "unassigned" &&
      event.studentsPerTeam &&
      (studentsByTeam[over.id]?.length ?? 0) + 1 > event.studentsPerTeam
    ) {
      return;
    }
    studentsRef.doc(active.id).update({
      team: over.id === "unassigned" ? null : teamsRef.doc(over.id),
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <Stack spacing={6} flex={1}>
        <HStack alignItems="flex-end" spacing={6}>
          <Heading size="2xl">{event.name}</Heading>
          <Heading size="lg">{org.name}</Heading>
        </HStack>
        <Divider />
        <Teams
          title="Teams"
          event={event}
          teams={teams}
          maxTeams={event.maxTeams}
          studentsByTeam={studentsByTeam}
          onAddTeam={handleAddTeam}
          onUpdateTeam={handleUpdateTeam}
          onDeleteTeam={handleDeleteTeam}
          costPerStudent={event.costPerStudent}
          maxStudents={eventOrg?.maxStudents ?? 0}
          seatsRemaining={seatsRemaining}
          stripeAccount={entity.stripeAccountId}
        />
        <Divider />
        <Students students={studentsByTeam[null] ?? []} onAddStudent={handleAddStudent} />
      </Stack>
    </DndContext>
  );
};

const TeamsPage = () => (
  <OrgProvider>
    <EventProvider>
      <TeamsContent />
    </EventProvider>
  </OrgProvider>
);

export default TeamsPage;
