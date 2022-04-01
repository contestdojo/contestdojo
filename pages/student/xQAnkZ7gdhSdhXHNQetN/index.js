/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Divider, Heading, HStack, Icon, Stack, Tag, Text } from "@chakra-ui/react";
import { HiUser } from "react-icons/hi";
import { useFirestoreCollectionData, useFirestoreDocData, useUser } from "reactfire";

import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";
import ParentEmailForm from "~/components/forms/ParentEmailForm";
import { useFormState } from "~/helpers/utils";

const Event = () => {
  const { ref: eventRef, data: event } = useEvent();
  const { data: user } = useUser();

  const studentRef = eventRef.collection("students").doc(user.uid);
  const { data: student } = useFirestoreDocData(studentRef, { idField: "id" });

  const teamRef = student.team ?? eventRef.collection("teams").doc("none"); // Hack for conditionals
  const teamMembersRef = eventRef.collection("students").where("team", "==", teamRef);
  const { data: teamMembers } = useFirestoreCollectionData(teamMembersRef, { idField: "id" });

  const { data: org } = useFirestoreDocData(student.org);
  const { data: team } = useFirestoreDocData(teamRef);

  // Waivers

  const [formState, wrapAction] = useFormState();

  const handleSubmit = wrapAction(async ({ parentEmail, birthdate, gender }) => {
    await studentRef.set({ parentEmail, birthdate, gender }, { merge: true });
  });

  return (
    <Stack spacing={6} flexBasis={600}>
      <p>
        {student.team
          ? `Welcome to ${event.name}! Your coach at ${org.name} has assigned you to Team ${team.name}. `
          : `Welcome to ${event.name}! You have yet to be assigned a team by your coach. `}
        You will complete registration and take tests on this portal.
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
        </Card>
      )}

      <ButtonLink
        href={event.waiver && !student.waiver ? "#" : `/student/xQAnkZ7gdhSdhXHNQetN/tests`}
        colorScheme="blue"
        size="lg"
        isDisabled={event.waiver && !student.waiver}
      >
        Click here to take your tests
      </ButtonLink>

      <Divider />
      <Heading size="lg">Waivers</Heading>

      {student.waiverSigned ? (
        <Alert status="success">
          <AlertIcon />
          Your waiver has been signed.
        </Alert>
      ) : student.waiverSent ? (
        <Alert status="info">
          <AlertIcon />A waiver form has been sent to {student.parentEmail}.
        </Alert>
      ) : (
        <>
          {student.parentEmail && student.birthdate && student.gender ? (
            <Alert status="info">
              <AlertIcon />A waiver form has been requested for {student.parentEmail}. It may take up to two days for
              the form to be sent. This page will be updated when the waiver is complete.
            </Alert>
          ) : (
            <p>
              This tournament requires waivers to be completed before you may compete. Your parent or guardian must
              complete this waiver. The waiver will be sent directly to your parent&apos;s email for them to complete.
              Please enter their email address below:
            </p>
          )}
          <ParentEmailForm
            onSubmit={handleSubmit}
            buttonText={student.parentEmail ? "Update Personal Information" : "Request Waiver"}
            defaultValues={student}
            {...formState}
          />
        </>
      )}
    </Stack>
  );
};

export default Event;
