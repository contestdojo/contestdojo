/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Button,
  Divider,
  Heading,
  HStack,
  Icon,
  Stack,
  Tag,
  Text,
  useDisclosure
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { HiUser } from "react-icons/hi";
import {
  useAuth,
  useFirestoreCollectionData,
  useFirestoreDocData,
  useStorage,
  useStorageDownloadURL,
  useUser
} from "reactfire";

import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";
import WaiverRequestForm from "~/components/forms/WaiverRequestForm";
import { useFormState } from "~/helpers/utils";


const DownloadWaiver = ({ waiver }) => {
  const storage = useStorage();
  const { data: waiverURL } = useStorageDownloadURL(storage.ref().child(waiver));
  return (
    <Button colorScheme="blue" onClick={() => window.open(waiverURL, "_blank")} alignSelf="flex-start">
      Download Signed Waiver
    </Button>
  );
};

const Event = () => {
  const auth = useAuth();

  const { ref: eventRef, data: event } = useEvent();
  const { data: user } = useUser();
  const { eventId } = useRouter().query;

  const studentRef = eventRef.collection("students").doc(user.uid);
  const { data: student } = useFirestoreDocData(studentRef, { idField: "id" });

  const teamRef = student.team ?? eventRef.collection("teams").doc("none"); // Hack for conditionals
  const teamMembersRef = eventRef.collection("students").where("team", "==", teamRef);
  const { data: teamMembers } = useFirestoreCollectionData(teamMembersRef, { idField: "id" });

  const { data: org } = useFirestoreDocData(student.org);
  const { data: team } = useFirestoreDocData(teamRef);

  // Waivers

  const [formState, wrapAction] = useFormState();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleSubmit = wrapAction(async ({ parentEmail }) => {
    const authorization = await auth.currentUser.getIdToken();
    const resp = await fetch("/api/student/request_waiver", {
      method: "POST",
      headers: { authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, eventId, parentEmail }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    onOpen();
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
        href={event.waiver && !student.waiver && !student.waiverSigned ? "#" : `/student/${eventId}/tests`}
        colorScheme="blue"
        size="lg"
        isDisabled={event.waiver && !student.waiver && !student.waiverSigned}
      >
        Click here to take your tests
      </ButtonLink>

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
              <Text>
                This tournament requires waivers to be completed before you may compete. Your parent or guardian must
                complete this waiver. The waiver will be sent directly to your parent&apos;s email for them to complete.
                Please enter their email address below:
              </Text>
              <WaiverRequestForm onSubmit={handleSubmit} {...formState} />
              <AlertDialog isOpen={isOpen} onClose={onClose}>
                <AlertDialogOverlay>
                  <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                      Waiver Request Sent
                    </AlertDialogHeader>
                    <AlertDialogBody>
                      A waiver signature request has been sent to your parent/guardian. Please have them check their
                      email to continue the process.
                    </AlertDialogBody>
                    <AlertDialogFooter>
                      <Button colorScheme="blue" onClick={onClose}>
                        OK
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialogOverlay>
              </AlertDialog>
            </>
          )}
        </>
      )}
    </Stack>
  );
};

export default Event;
