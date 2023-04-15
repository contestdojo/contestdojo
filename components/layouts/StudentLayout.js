/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Heading, HStack, Link, Stack, Tag, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { HiPlus } from "react-icons/hi";
import { useFirestore, useFirestoreCollection, useFirestoreDocData } from "reactfire";

import MainLayout from "./MainLayout";

import AuthWrapper from "~/components/AuthWrapper";
import { useUserRef } from "~/helpers/utils";

const EventLink = ({ id, students, activeStyle }) => {
  const { query } = useRouter();

  const firestore = useFirestore();
  const eventRef = firestore.collection("events").doc(id);
  const { data: event } = useFirestoreDocData(eventRef);

  let teamData = students.find((s) => s.ref.parent.parent.id === event.id)?.data();

  return (
    <NextLink href={`/student/${id}`} passHref>
      <Link {...(id == query.eventId && activeStyle)} _hover={activeStyle} borderRadius={4} px={3} py={2}>
        <HStack>
          <Text>{event.name}</Text>
          {teamData?.number && (
            <Tag colorScheme="blue" size="sm">
              {teamData?.number}
            </Tag>
          )}
        </HStack>
        {teamData?.checkInPool && <Text color="gray.500">{teamData?.checkInPool}</Text>}
      </Link>
    </NextLink>
  );
};

const Sidebar = () => {
  const firestore = useFirestore();
  const userRef = useUserRef();

  const studentsQuery = firestore.collectionGroup("students").where("user", "==", userRef);
  const students = useFirestoreCollection(studentsQuery, { idField: "id" }).data.docs;
  const eventIds = students.map((x) => x.ref.parent.parent.id);

  const activeStyle = { backgroundColor: "gray.100" };

  return (
    <Stack spacing={3}>
      <Heading size={3}>Events</Heading>
      <Stack spacing={1} style={{ marginLeft: "-0.75rem", marginRight: "-0.75rem" }}>
        {eventIds.map((x) => (
          <EventLink id={x} key={x} students={students} activeStyle={activeStyle} />
        ))}
        <NextLink href={`/student`} passHref>
          <Link _hover={activeStyle} borderRadius={4} px={3} py={2}>
            <HStack>
              <HiPlus />
              <Text>Register for New Event</Text>
            </HStack>
          </Link>
        </NextLink>
      </Stack>
    </Stack>
  );
};

const StudentLayout = ({ children }) => (
  <AuthWrapper type="student">
    <MainLayout sidebar={<Sidebar />}>{children}</MainLayout>
  </AuthWrapper>
);

export default StudentLayout;
