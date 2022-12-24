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
  ButtonGroup,
  Divider,
  Heading,
  HStack,
  Icon,
  Stack,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { loadStripe } from "@stripe/stripe-js";
import Hashids from "hashids";
import { useRouter } from "next/router";
import { useState } from "react";
import { HiUser } from "react-icons/hi";
import {
  useAuth,
  useFirestore,
  useFirestoreCollectionData,
  useFirestoreDocData,
  useStorage,
  useStorageDownloadURL,
  useUser,
} from "reactfire";

import AddTeamModal from "~/components/AddTeamModal";
import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import FormField from "~/components/FormField";
import AddStudentForm from "~/components/forms/AddStudentForm";
import WaiverRequestForm from "~/components/forms/WaiverRequestForm";
import JoinTeamModal from "~/components/JoinTeamModal";
import Markdown from "~/components/Markdown";
import RadioToggle from "~/components/RadioToggle";
import { useFormState, useUserData } from "~/helpers/utils";

const DownloadWaiver = ({ waiver }) => {
  const storage = useStorage();
  const { data: waiverURL } = useStorageDownloadURL(storage.ref().child(waiver));
  return (
    <Button colorScheme="blue" onClick={() => window.open(waiverURL, "_blank")} alignSelf="flex-start">
      Download Signed Waiver
    </Button>
  );
};

const StudentRegistration = ({ event }) => {
  const [registrationType, setRegistrationType] = useState(event.studentRegistrationEnabled ? "student" : "org");
  const [orgJoinCode, setOrgJoinCode] = useState("");

  const auth = useAuth();
  const { data: entity } = useFirestoreDocData(event.owner);
  const { data: user, ref: userRef } = useUserData();
  const { ref: eventRef } = useEvent();
  const studentRef = eventRef.collection("students").doc(user.uid);

  const [formState, wrapAction] = useFormState();

  const handleStudentPurchase = async () => {
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch(`/api/student/${eventRef.id}/pay`, {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();

    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY, { stripeAccount: entity.stripeAccountId });

    const stripe = await stripePromise;
    const result = await stripe.redirectToCheckout({
      sessionId: data.id,
    });

    if (result.error) throw new Error(result.error.message);
  };

  const handleSubmit = wrapAction(async (_values) => {
    if (registrationType === "org") {
      const orgQuery = eventRef.collection("orgs").where("code", "==", orgJoinCode).limit(1);
      const orgs = await orgQuery.get();
      if (orgs.empty) throw new Error("There is no team with that code!");

      const values = { ..._values, id: userRef.id, email: user.email, user: userRef, org: orgs.docs[0].ref };
      await studentRef.set(values, { merge: true });
    }

    if (registrationType === "student") {
      if (event.costPerStudent) {
        await handleStudentPurchase();
      } else {
        const values = { ..._values, id: userRef.id, email: user.email, user: userRef, org: null };
        await studentRef.set(values, { merge: true });
      }
    }
  });

  return (
    <Stack spacing={4}>
      <Heading size="lg">Registration</Heading>

      <RadioToggle
        options={[
          ["Register as Independent Student", "student"],
          ["Register with an Organization", "org"],
        ]}
        name="registrationType"
        value={registrationType}
        onChange={setRegistrationType}
      />

      {registrationType === "org" && (
        <FormField
          name="orgJoinCode"
          label="Organization Join Code"
          placeholder="abcd"
          componentProps={{ value: orgJoinCode, onChange: (e) => setOrgJoinCode(e.target.value) }}
          isRequired
        />
      )}

      <AddStudentForm
        onSubmit={handleSubmit}
        customFields={event.customFields ?? []}
        allowEditEmail={false}
        defaultValues={{ fname: user.fname, lname: user.lname, email: user.email }}
        {...formState}
        buttonText="Submit Registration"
      />
    </Stack>
  );
};

const NotRegistered = ({ event }) => (
  <Stack spacing={6}>
    <Box mb={-4}>
      <Markdown>{event.description}</Markdown>
    </Box>
    <Divider />
    {!event.studentRegistrationEnabled ? (
      <Text>
        This event only offers coach-based registration. Please have your school&apos;s math team coach register you for
        the event.
      </Text>
    ) : (
      <StudentRegistration event={event} />
    )}
  </Stack>
);

const CreateOrJoinTeam = () => {
  const firestore = useFirestore();

  const { data: event, ref: eventRef } = useEvent();
  const { ref: userRef } = useUserData();

  const [formState, wrapAction] = useFormState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpen2, onOpen: onOpen2, onClose: onClose2 } = useDisclosure();

  const handleCreateTeam = wrapAction(async ({ name, customFields }) => {
    const hashids = new Hashids(eventRef.id, 4);

    const batch = async (transaction) => {
      const counterRef = eventRef.collection("counters").doc("teams");
      const teamRef = eventRef.collection("teams").doc();
      const studentRef = eventRef.collection("students").doc(userRef.id);

      const counter = await transaction.get(counterRef);
      const next = counter.data()?.next ?? 0;
      transaction.set(counterRef, { next: next + 1 });

      transaction.set(teamRef, {
        name,
        org: null,
        code: hashids.encode(next),
        customFields: customFields ?? {},
      });
      transaction.update(studentRef, { team: teamRef });
    };

    await firestore.runTransaction(batch);

    onClose();
  });

  const handleJoinTeam = wrapAction(async ({ code }) => {
    const teamQuery = eventRef.collection("teams").where("code", "==", code).limit(1);
    const studentRef = eventRef.collection("students").doc(userRef.id);
    const teams = await teamQuery.get();

    if (teams.empty) throw new Error("There is no team with that code!");

    const studentsQuery = eventRef.collection("students").where("team", "==", teams.docs[0].ref);
    const students = await studentsQuery.get();

    if (students.size >= event.studentsPerTeam) throw new Error("That team is full!");

    await studentRef.update({ team: teams.docs[0].ref });

    onClose2();
  });

  return (
    <Alert
      as={Stack}
      spacing={4}
      status="warning"
      height="64"
      flexDir="column"
      textAlign="center"
      justifyContent="center"
      alignItems="center"
    >
      <AlertIcon mr={0} boxSize="40px" />

      <Stack spacing={1}>
        <AlertTitle fontSize="lg">Registration is not complete!</AlertTitle>
        <AlertDescription>You must create or join a team to complete registration.</AlertDescription>
      </Stack>

      <ButtonGroup justifyContent="center">
        <Button colorScheme="blue" size="sm" isLoading={formState.isLoading} onClick={onOpen}>
          Create Team
        </Button>
        <Button size="sm" isLoading={formState.isLoading} onClick={onOpen2}>
          Join Team
        </Button>
      </ButtonGroup>

      <AddTeamModal
        initial
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleCreateTeam}
        customFields={event.customTeamFields}
        {...formState}
      />
      <JoinTeamModal isOpen={isOpen2} onClose={onClose2} onSubmit={handleJoinTeam} {...formState} />

      {formState.error && <Text>{formState.error.message}</Text>}
    </Alert>
  );
};

const DownloadScoreReport = ({ scoreReport }) => {
  const storage = useStorage();
  const { data: scoreReportURL } = useStorageDownloadURL(storage.ref().child(scoreReport));
  return (
    <Button colorScheme="blue" size="sm" onClick={() => window.open(scoreReportURL, "_blank")}>
      Download
    </Button>
  );
};

const Event = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [openDialog] = useDialog();

  const { ref: eventRef, data: event } = useEvent();
  const { data: user } = useUser();
  const { eventId } = useRouter().query;

  const studentRef = eventRef.collection("students").doc(user.uid);
  const { data: student } = useFirestoreDocData(studentRef, { idField: "id" });

  const teamRef = student?.team ?? eventRef.collection("teams").doc("none"); // Hack for conditionals
  const teamMembersRef = eventRef.collection("students").where("team", "==", teamRef);
  const { data: teamMembers } = useFirestoreCollectionData(teamMembersRef, { idField: "id" });

  const orgRef = student?.org ?? firestore.collection("orgs").doc("none");
  const { data: org } = useFirestoreDocData(orgRef);
  const { data: team } = useFirestoreDocData(teamRef);

  // Waivers

  const [formState, wrapAction] = useFormState();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleUpdateTeam = wrapAction(async ({ name, customFields }) => {
    if (student.org) return;
    await teamRef.update({ name, customFields: customFields ?? {} });
    onClose();
  });

  const handleLeaveTeam = wrapAction(async () => {
    if (student.org) return;
    await studentRef.update({ team: null });
  });

  const handleUpdate = wrapAction(async (_values) => {
    const { id, email, user, org, ...values } = _values;
    await studentRef.update(values);
  });

  const [formStateWaiver, wrapActionWaiver] = useFormState();

  const handleSubmitWaiver = wrapActionWaiver(async ({ parentEmail }) => {
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch("/api/student/request_waiver", {
      method: "POST",
      headers: { authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, eventId, parentEmail }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    openDialog({
      type: "alert",
      title: "Waiver Request Sent",
      description:
        "A waiver signature request has been sent to your parent/guardian. Please have them check their email to continue the process.",
    });
  });

  const handleUnregister = () => {
    openDialog({
      type: "confirm",
      title: "Are you sure?",
      description:
        'This action is irreversible and <b style="color: red">payments will not be refunded</b>. You most likely don\'t want to do this. Please contact the event organizer if you have any concerns.',
      onConfirm: async () => {
        await studentRef.delete();
      },
    });
  };

  if (!student) return <NotRegistered event={event} />;
  if (student.team && !team) return null;
  if (student.org && !org) return null;

  return (
    <Stack spacing={6} flexBasis={600}>
      <p>
        Welcome to {event.name}!{" "}
        {student.org && (
          <>
            {event.teamsEnabled && student.team && `Your coach at ${org.name} has assigned you to Team ${team.name}. `}
            {event.teamsEnabled && !student.team && `You have yet to be assigned a team by your coach. `}
          </>
        )}
      </p>

      {student.team && (
        <Card p={4} as={Stack} spacing={4}>
          <HStack>
            <Heading size="md">{team.name}</Heading>
            {team.number && <Tag size="sm">{team.number}</Tag>}
          </HStack>

          {teamMembers.map((x) => (
            <HStack key={x.id}>
              <Icon as={HiUser} boxSize={6} />
              {x.number && (
                <Tag colorScheme={x.id === student.id ? "blue" : undefined} size="sm">
                  {x.number}
                </Tag>
              )}
              <Text>
                {x.fname} {x.lname}
              </Text>
            </HStack>
          ))}

          {team.code && (
            <Text>
              Invite other students to join your team with the code <strong>{team.code}</strong>.
            </Text>
          )}

          {!student.org && (
            <ButtonGroup>
              <Button flex="1" size="sm" onClick={onOpen}>
                Edit Team
              </Button>

              <Button flex="1" size="sm" onClick={handleLeaveTeam} isLoading={formState.isLoading}>
                Leave Team
              </Button>

              <AddTeamModal
                isOpen={isOpen}
                onClose={onClose}
                onSubmit={handleUpdateTeam}
                customFields={event.customTeamFields}
                defaultValues={team}
                {...formState}
              />
            </ButtonGroup>
          )}
        </Card>
      )}

      {!student.org && !student.team && <CreateOrJoinTeam />}

      <ButtonLink
        href={event.waiver && !student.waiver && !student.waiverSigned ? "#" : `/student/${eventId}/tests`}
        colorScheme="blue"
        size="lg"
        isDisabled={(event.waiver && !student.waiver && !student.waiverSigned) || (event.teamsEnabled && !student.team)}
      >
        Click here to take your tests
      </ButtonLink>

      {(student.scoreReport || team?.scoreReport) && (
        <>
          <Divider />

          <Heading size="lg">Score Reports</Heading>

          {student.scoreReport && (
            <Card p={4} as={HStack} justifyContent="space-between" spacing={4}>
              <Heading size="md">Individual Score Report</Heading>
              <DownloadScoreReport scoreReport={student.scoreReport}>Download</DownloadScoreReport>
            </Card>
          )}

          {team.scoreReport && (
            <Card p={4} as={HStack} justifyContent="space-between" spacing={4}>
              <Heading size="md">Team Score Report</Heading>
              <DownloadScoreReport scoreReport={team.scoreReport}>Download</DownloadScoreReport>
            </Card>
          )}
        </>
      )}

      {event.waiver && (
        <>
          <Divider />
          <Heading size="lg">Waivers</Heading>
          {student.waiver ? (
            <>
              <Alert status="success">
                <AlertIcon />
                Your waiver has been signed.
              </Alert>
              <DownloadWaiver waiver={student.waiver} />
            </>
          ) : (
            <>
              <Alert status="error">
                <AlertIcon />
                Your registration is not complete until your waiver is signed.
              </Alert>
              <Text>
                This tournament requires waivers to be completed before you may compete. Your parent or guardian must
                complete this waiver. The waiver will be sent directly to your parent&apos;s email for them to complete.
                Please enter their email address below:
              </Text>
              <WaiverRequestForm onSubmit={handleSubmitWaiver} {...formStateWaiver} />
            </>
          )}
        </>
      )}

      <Divider />

      <Heading size="lg">Student Information</Heading>
      <AddStudentForm
        onSubmit={handleUpdate}
        customFields={event.customFields ?? []}
        allowEditEmail={false}
        {...formState}
        defaultValues={student}
      />
      {!student.org && (
        <Button colorScheme="red" variant="link" onClick={handleUnregister}>
          Unregister
        </Button>
      )}
    </Stack>
  );
};

export default Event;
