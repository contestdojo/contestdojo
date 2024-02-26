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
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnorderedList,
  useDisclosure,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { loadStripe } from "@stripe/stripe-js";
import firebase from "firebase";
import Hashids from "hashids";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { HiClipboardCheck, HiDotsHorizontal, HiExclamation, HiPencil, HiTrash } from "react-icons/hi";
import { useAuth, useFirestore, useFirestoreCollectionData, useFirestoreDocData, useUser } from "reactfire";

import AddStudentModal from "~/components/AddStudentModal";
import AddTeamModal from "~/components/AddTeamModal";
import BlankCard from "~/components/BlankCard";
import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import EventProvider, { useEvent } from "~/components/contexts/EventProvider";
import OrgProvider, { useOrg } from "~/components/contexts/OrgProvider";
import RegisterOrgForm from "~/components/forms/RegisterOrgForm";
import InviteStudentModal from "~/components/InviteStudentModal";
import Markdown from "~/components/Markdown";
import PurchaseSeatsModal from "~/components/PurchaseSeatsModal";
import { testRule } from "~/helpers/rules";
import { toDict, useFormState } from "~/helpers/utils";

const StudentCard = ({ id, fname, lname, email, waiver, number, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const props = transform
    ? { cursor: "grabbing", shadow: "xl", transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : { cursor: "grab" };

  return (
    <Card as={Stack} direction="row" my={1} mx={2} spacing={0} {...props} {...attributes}>
      <Stack flex={1} spacing={0} p={2} position="relative" ref={setNodeRef} {...listeners}>
        <HStack spacing={2}>
          {number && (
            <Text color="gray.500" fontSize="sm">
              {number}
            </Text>
          )}
          <Heading as="h4" size="sm">
            {fname} {lname}
          </Heading>
        </HStack>
        <Text fontSize="sm">{email}</Text>
        <Box position="absolute" top={2} right={2} lineHeight={1}>
          {waiver !== undefined &&
            (waiver ? (
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
            ))}
        </Box>
      </Stack>
      <Box>
        <Divider orientation="vertical" />
      </Box>
      <Stack spacing={0}>
        <IconButton
          icon={<Icon as={HiPencil} />}
          size="sm"
          variant="ghost"
          h="full"
          borderLeftRadius={0}
          onClick={onEdit}
        />
        <Divider />
        <IconButton
          icon={<Icon as={HiTrash} />}
          size="sm"
          variant="ghost"
          h="full"
          borderLeftRadius={0}
          onClick={onDelete}
        />
      </Stack>
    </Card>
  );
};

const TeamCard = ({ event, team, students, onUpdate, onDelete, onEditStudent, needSeats, waiver, onDeleteStudent }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOver, setNodeRef } = useDroppable({ id: team.id });
  const props = { backgroundColor: isOver ? "gray.100" : undefined };

  const [editing, setEditing] = useState(null);
  const [formState, wrapAction] = useFormState();

  const handleEdit = wrapAction(async (values) => {
    await onUpdate(values);
    onClose();
  });

  const handleEditStudent = wrapAction(async (values) => {
    await onEditStudent(students[editing].id, values);
    setEditing(null);
  });

  return (
    <Card
      as={Stack}
      spacing={0}
      flex={1}
      p={2}
      minHeight={event.teamsEnabled ? "xs" : undefined}
      transition="background-color 0.1s"
      {...props}
    >
      <HStack px={2}>
        {team.number && <Text color="gray.500">{team.number}</Text>}
        {team.checkInPool && <Text color="gray.500">{team.checkInPool}</Text>}
        <Heading as="h4" size="md" position="relative" flex="1">
          {team.name}
        </Heading>

        <Menu>
          <MenuButton as={IconButton} icon={<HiDotsHorizontal />} variant="ghost" rounded="full" mr={-2}></MenuButton>
          <MenuList>
            <MenuItem icon={<HiTrash />} onClick={onOpen}>
              Edit
            </MenuItem>
            <MenuItem icon={<HiTrash />} color="red.500" onClick={onDelete}>
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {event.teamsEnabled ? (
        <Flex direction="column" flex={1} ref={setNodeRef}>
          {students.map((x, i) => (
            <StudentCard
              key={x.id}
              {...x}
              waiver={waiver ? x.waiver || !!x.waiverSigned : undefined}
              onEdit={() => setEditing(i)}
              onDelete={() => onDeleteStudent(x.id)}
            />
          ))}
          {students.length === 0 &&
            (needSeats ? <BlankCard>More seats required</BlankCard> : <BlankCard>Drag students here</BlankCard>)}
        </Flex>
      ) : (
        <Wrap
          flex={1}
          spacing={0}
          p={students.length === 0 ? "2" : "0"}
          transition="background-color 0.1s"
          borderRadius={4}
          ref={setNodeRef}
          {...props}
        >
          {students.map((x, i) => (
            <WrapItem key={x.id}>
              <StudentCard
                key={x.id}
                {...x}
                waiver={waiver ? x.waiver || !!x.waiverSigned : undefined}
                onEdit={() => setEditing(i)}
                onDelete={() => onDeleteStudent(x.id)}
              />
            </WrapItem>
          ))}
          {students.length === 0 &&
            (needSeats ? <BlankCard>More seats required</BlankCard> : <BlankCard>Drag students here</BlankCard>)}
        </Wrap>
      )}

      <AddTeamModal
        heading="Edit Team"
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleEdit}
        customFields={event.customTeamFields}
        defaultValues={team}
        {...formState}
      />

      <AddStudentModal
        key={editing}
        title="Edit Student"
        isOpen={editing != null}
        onClose={() => setEditing(null)}
        onSubmit={handleEditStudent}
        defaultValues={students[editing]}
        customFields={event.customFields ?? []}
        allowEditEmail={false}
        {...formState}
      />
    </Card>
  );
};

const PurchaseSeats = ({ stripeAccount, event }) => {
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

  return event.frozen || !event.purchaseSeatsEnabled ? (
    <Tooltip label="This event has disabled purchasing seats.">
      <Button colorScheme="blue" isDisabled={true}>
        Purchase Seats
      </Button>
    </Tooltip>
  ) : event.purchaseSeats ? (
    <ButtonLink href={event.purchaseSeats} colorScheme="blue" isDisabled={!!event.frozen}>
      Purchase Seats
    </ButtonLink>
  ) : (
    <>
      <Button colorScheme="blue" onClick={onOpen} isDisabled={!!event.frozen}>
        Purchase Seats
      </Button>
      <PurchaseSeatsModal isOpen={isOpen} onClose={onClose} onSubmit={handlePurchaseSeats} {...formState} />
    </>
  );
};

const Teams = ({
  maxTeams,
  eventOrg,
  teams,
  waiver,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  studentsByTeam,
  costPerStudent,
  costAdjustments,
  onEditStudent,
  onDeleteStudent,
  maxStudents,
  seatsRemaining,
  stripeAccount,
}) => {
  const { data: event } = useEvent();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formState, wrapAction] = useFormState();

  let effectiveCostPerStudent = useMemo(() => {
    let value = costPerStudent;
    for (const adjustment of costAdjustments ?? []) {
      if (testRule(adjustment.rule, eventOrg)) {
        value += adjustment.adjustment;
      }
    }
    return value;
  }, [eventOrg, costPerStudent, costAdjustments]);

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
      <Heading size="lg">{event.teamsEnabled ? "Teams" : "Participating Students"}</Heading>
      {event.teamsEnabled && (
        <>
          <p>
            Click the &ldquo;Add Team&rdquo; button to create a new team.
            {effectiveCostPerStudent > 0 && (
              <>
                {" "}
                Before you can add students to teams, you must purchase seats.{" "}
                {event.purchaseSeatsEnabled && !event.purchaseSeats && (
                  <>
                    Each seat currently costs <b>${effectiveCostPerStudent} USD</b>.{" "}
                  </>
                )}
                You have currently paid for <b>{maxStudents}</b> seats, with <b>{seatsRemaining}</b> remaining. Seats
                are not associated with any particular student, and unassigned students do not use a seat.
              </>
            )}
          </p>
          <Markdown>{event.costDescription ?? ""}</Markdown>
        </>
      )}
      {teams.length > 0 && (
        <SimpleGrid columns={event.teamsEnabled ? { sm: 1, lg: 2, xl: 3 } : 1} spacing={4}>
          {teams.map((x) => (
            <TeamCard
              key={x.id}
              team={x}
              event={event}
              onEditStudent={onEditStudent}
              onDeleteStudent={onDeleteStudent}
              onUpdate={(update) => onUpdateTeam(x.id, update)}
              onDelete={() => onDeleteTeam(x.id)}
              students={studentsByTeam[x.id] ?? []}
              needSeats={effectiveCostPerStudent > 0 && seatsRemaining <= 0}
              waiver={waiver}
            />
          ))}
        </SimpleGrid>
      )}
      <ButtonGroup>
        {event.teamsEnabled &&
          (teams.length < (maxTeams ?? 100) ? (
            <Button colorScheme="blue" alignSelf="flex-start" onClick={onOpen} isDisabled={!!event.frozen}>
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
          ))}
        {effectiveCostPerStudent > 0 && stripeAccount && <PurchaseSeats stripeAccount={stripeAccount} event={event} />}
      </ButtonGroup>
      <AddTeamModal
        initial
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleAddTeam}
        customFields={event.customTeamFields}
        {...formState}
      />
    </Stack>
  );
};

const Students = ({
  eventOrg,
  eventOrgRef,
  invites,
  students,
  onInviteStudents,
  onAddStudent,
  onEditStudent,
  event,
  eventRef,
  waiver,
  onDeleteStudent,
  stripeAccount,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpen2, onOpen: onOpen2, onClose: onClose2 } = useDisclosure();

  const [editing, setEditing] = useState(null);
  const [formState, wrapAction] = useFormState();

  const handleInviteStudents = wrapAction(async (values) => {
    await onInviteStudents(values);
    onClose2();
  });

  const handleAddStudent = wrapAction(async (values) => {
    console.log("test");
    await onAddStudent(values);
    onClose();
  });

  const handleEditStudent = wrapAction(async (values) => {
    await onEditStudent(students[editing].id, values);
    setEditing(null);
  });

  // Unassigned droppable
  const { isOver, setNodeRef } = useDroppable({ id: "unassigned" });
  const props = {
    backgroundColor: isOver ? "gray.100" : undefined,
  };

  const displayInvites = invites.filter((x) => !students.some((y) => y.email == x.email));

  const firestore = useFirestore();

  useEffect(() => {
    if (eventOrg.code) return;

    const hashids = new Hashids(`${eventRef.id}/orgs`, 4);

    firestore.runTransaction(async (transaction) => {
      const counterRef = eventRef.collection("counters").doc("orgs");
      const counter = await transaction.get(counterRef);
      const next = counter.data()?.next ?? 0;
      transaction.set(counterRef, { next: next + 1 });
      transaction.set(eventOrgRef, { code: hashids.encode(next) }, { merge: true });
    });
  }, [eventOrg.code]);

  return (
    <Stack spacing={4}>
      <Heading size="lg">Unassigned (Non-participating) Students</Heading>
      <p>
        Once you add a student to your organization, they will receive an email invitation to create an account on our
        website. If a student already has an account from a previous tournament (such as the Stanford Math Tournament),
        they will receive an email letting them know to reuse that same account.
      </p>
      <p>
        <strong>
          Students in this section are not officially registered.{" "}
          {event.teamsEnabled
            ? "You must move all participating students to a team."
            : 'You must move all participating students to the "Participating Students" section.'}
        </strong>
      </p>
      <Wrap
        spacing={0}
        style={students.length === 0 ? {} : { marginLeft: "-0.5rem", marginRight: "-0.5rem" }}
        transition="background-color 0.1s"
        borderRadius={4}
        ref={setNodeRef}
        {...props}
      >
        {students.map((x, i) => (
          <WrapItem key={x.id}>
            <StudentCard
              {...x}
              width={300}
              waiver={waiver ? x.waiver || !!x.waiverSigned : undefined}
              onEdit={() => setEditing(i)}
              onDelete={() => onDeleteStudent(x.id)}
            />
          </WrapItem>
        ))}
        {event.teamsEnabled && students.length === 0 && <BlankCard>Drag students here</BlankCard>}
        {!event.teamsEnabled && students.length === 0 && <BlankCard>No students added</BlankCard>}
      </Wrap>

      <ButtonGroup>
        <Button colorScheme="blue" alignSelf="flex-start" onClick={onOpen2} isDisabled={!!event.frozen}>
          Invite Students
        </Button>
        <Button colorScheme="blue" alignSelf="flex-start" onClick={onOpen} isDisabled={!!event.frozen}>
          Manually Add Student
        </Button>
      </ButtonGroup>

      <Text>
        Students can also use the code <strong>{eventOrg.code}</strong> to join your organization.
      </Text>

      {displayInvites.length > 0 && (
        <Stack spacing={2}>
          <Heading size="md">Pending Invites</Heading>
          <Box>
            <UnorderedList>
              {displayInvites.map((x) => (
                <ListItem key={x.email}>{x.email}</ListItem>
              ))}
            </UnorderedList>
          </Box>
        </Stack>
      )}

      <InviteStudentModal isOpen={isOpen2} onClose={onClose2} onSubmit={handleInviteStudents} {...formState} />
      <AddStudentModal
        initial
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleAddStudent}
        customFields={event.customFields ?? []}
        {...formState}
      />
      <AddStudentModal
        key={editing}
        id="edit-student"
        title="Edit Student"
        isOpen={editing != null}
        onClose={() => setEditing(null)}
        onSubmit={handleEditStudent}
        defaultValues={students[editing]}
        customFields={event.customFields ?? []}
        allowEditEmail={false}
        {...formState}
      />
    </Stack>
  );
};

type AddOnProps = {
  eventOrg: string;
  stripeAccount: string;
  id: string;
  name: string;
  cost: number;
  enabled: boolean;
};

const AddOn = ({ eventOrg, stripeAccount, id, name, cost, enabled }: AddOnProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formState, wrapAction] = useFormState();
  const auth = useAuth();
  const { orgId, eventId } = useRouter().query;
  const { data: user } = useUser();

  const handlePurchaseSeats = wrapAction(async (values) => {
    const number = Number(values.number);
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch(`/api/coach/${orgId}/${eventId}/purchase-seats`, {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, number, addonId: id }),
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
    <Card as={Stack} p={4}>
      <Box>
        <Heading size="sm">{name}</Heading>
        <Text color="gray.500">${cost} / unit</Text>
      </Box>

      <Text>
        Purchased: <strong>{eventOrg.addOns?.[id] ?? 0}</strong>
      </Text>

      <Button colorScheme="blue" size="sm" onClick={onOpen} isDisabled={!enabled}>
        Purchase{(eventOrg.addOns?.[id] ?? 0) > 0 ? " More" : ""}
      </Button>

      <PurchaseSeatsModal
        title={name}
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handlePurchaseSeats}
        {...formState}
      />
    </Card>
  );
};

type AddOnsProps = {
  eventOrg: any;
  stripeAccount: string;
};

const AddOns = ({ eventOrg, stripeAccount }: AddOnsProps) => {
  const { data: event } = useEvent();

  return (
    <Stack spacing={4}>
      <Heading size="lg">Add-ons</Heading>
      <p>Purchase additional add-ons for your organization here.</p>
      <Wrap>
        {event.addOns?.map((x) => (
          <WrapItem key={x.id}>
            <AddOn eventOrg={eventOrg} stripeAccount={stripeAccount} {...x} />
          </WrapItem>
        ))}
      </Wrap>
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
  const { data: eventOrg } = useFirestoreDocData(eventOrgRef, { idField: "id" });

  const invitesRef = eventOrgRef.collection("invites");
  const { data: invites } = useFirestoreCollectionData(invitesRef, { idField: "email" });

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

  const [openDialog] = useDialog();
  const router = useRouter();
  const [formState, wrapAction] = useFormState();

  useEffect(() => {
    if (!eventOrg) {
      router.replace(`/coach/${orgRef.id}/${eventRef.id}`);
    }

    if (!event.teamsEnabled && teams.length == 0) {
      // Automatically create a team per organization for non-team events
      teamsRef.doc(orgRef.id).set({ name: org.name, org: orgRef }, { merge: true });
    }
  }, [event, eventOrg]);

  if (!eventOrg) {
    return null;
  }

  if (event.coachRegistrationDisabled) {
    return "Coach-based registration is disabled for this event. Students can register independently with their accounts.";
  }

  const handleEditRegistration = wrapAction(async ({ customFields }) => {
    await eventOrgRef.update({
      updateTime: firebase.firestore.FieldValue.serverTimestamp(),
      customFields: customFields ?? {},
    });
  });

  const handleAddTeam = async ({ name, customFields }) => {
    await teamsRef.add({ name, org: orgRef, customFields: customFields ?? {} });
  };

  const handleUpdateTeam = async (id, { name, customFields }) => {
    await teamsRef.doc(id).update({ name, customFields: customFields ?? {} });
  };

  const handleDeleteTeam = async (id) => {
    const batch = firestore.batch();
    for (const student of studentsByTeam[id] ?? []) {
      batch.update(studentsRef.doc(student.id), { team: null });
    }
    batch.delete(teamsRef.doc(id));
    await batch.commit();
  };

  const handleInviteStudents = async ({ emails }) => {
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch(`/api/coach/${orgRef.id}/${eventRef.id}/invite-students`, {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ emails }),
    });
    if (!resp.ok) throw new Error(await resp.text());
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
    if (snap.exists && snap.data().org) throw new Error("This student is already associated with an organization.");
    if (snap.exists) throw new Error("This student is already registered independently for this event.");

    await studentRef.set({
      ...values,
      fname,
      lname,
      email,
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

  const handleEditStudent = async (uid, _values) => {
    const { id, email, user, org, ...values } = _values;
    const studentRef = studentsRef.doc(uid);
    await studentRef.update(values);
  };

  const handleDeleteStudent = (uid) => {
    const studentRef = studentsRef.doc(uid);
    openDialog({
      type: "confirm",
      title: "Are you sure?",
      description: "This action is irreversible.",
      onConfirm: async () => {
        await studentRef.delete();
      },
    });
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    if (!studentsById[active.id].team && event.costPerStudent && seatsRemaining <= 0) return;
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

        {event.scoreReportsAvailable && (
          <>
            <Card p={4} maxW="md">
              <Stack spacing={4} alignItems="flex-start">
                <Heading size="md">Score Reports Available</Heading>
                <ButtonLink href={`/coach/${orgRef.id}/${eventRef.id}/reports`} colorScheme="blue" size="sm">
                  View Score Reports
                </ButtonLink>
              </Stack>
            </Card>
            <Divider />
          </>
        )}

        <Teams
          event={event}
          teams={teams}
          eventOrg={eventOrg}
          maxTeams={event.maxTeams}
          studentsByTeam={studentsByTeam}
          onAddTeam={handleAddTeam}
          onUpdateTeam={handleUpdateTeam}
          onDeleteTeam={handleDeleteTeam}
          costPerStudent={event.costPerStudent}
          costAdjustments={event.costAdjustments}
          maxStudents={eventOrg?.maxStudents ?? 0}
          seatsRemaining={seatsRemaining}
          stripeAccount={entity.stripeAccountId}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
          waiver={event.waiver}
        />

        <Divider />

        <Students
          eventOrg={eventOrg}
          eventOrgRef={eventOrgRef}
          invites={invites}
          students={studentsByTeam[null] ?? []}
          onInviteStudents={handleInviteStudents}
          onAddStudent={handleAddStudent}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
          event={event}
          eventRef={eventRef}
          waiver={event.waiver}
          stripeAccount={entity.stripeAccountId}
        />

        {event.addOns && (
          <>
            <Divider />
            <AddOns eventOrg={eventOrg} stripeAccount={entity.stripeAccountId} />
          </>
        )}

        {event.customOrgFields?.some((x) => !x.hidden) && (
          <>
            <Divider />
            <Heading size="lg">Edit Registration</Heading>
            <Box maxW={600}>
              <RegisterOrgForm
                onSubmit={handleEditRegistration}
                customFields={event.customOrgFields}
                defaultValues={eventOrg}
                {...formState}
              />
            </Box>
          </>
        )}
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
