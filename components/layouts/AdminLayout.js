/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Heading, Link, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useFirestore, useFirestoreCollectionData } from "reactfire";

import MainLayout from "./MainLayout";

import AuthWrapper from "~/components/AuthWrapper";
import { useUserRef } from "~/helpers/utils";

const Sidebar = () => {
  const { query } = useRouter();

  const firestore = useFirestore();
  const userRef = useUserRef();

  // Get entities
  const entitiesRef = firestore.collection("entities").where("admins", "array-contains", userRef);
  const { data: entities } = useFirestoreCollectionData(entitiesRef, { idField: "id" });
  const entityRefs = entities.map((x) => firestore.collection("entities").doc(x.id));

  // Get events
  const eventsRef = firestore.collection("events").where("owner", "in", [...entityRefs, "0"]);
  const { data: events } = useFirestoreCollectionData(eventsRef, { idField: "id" });

  events.sort((a, b) => a.name.localeCompare(b.name));

  const activeStyle = {
    backgroundColor: "gray.100",
  };

  return (
    <>
      <Stack spacing={3}>
        <Heading size={3}>Organizing Entities</Heading>
        <Stack spacing={1} style={{ marginLeft: "-0.75rem", marginRight: "-0.75rem" }}>
          {entities.map((x) => (
            <NextLink href={`/admin/${x.id}`} key={x.id}>
              <Link
                {...(x.id == query.entityId && !query.eventId && activeStyle)}
                _hover={activeStyle}
                borderRadius={4}
                px={3}
                py={2}
              >
                {x.name}
              </Link>
            </NextLink>
          ))}
        </Stack>
      </Stack>

      <Stack spacing={3}>
        <Heading size={3}>Events</Heading>
        <Stack spacing={1} style={{ marginLeft: "-0.75rem", marginRight: "-0.75rem" }}>
          {events.map((x) => (
            <NextLink href={`/admin/${x.owner.id}/${x.id}`} key={x.id}>
              <Link {...(x.id == query.eventId && activeStyle)} _hover={activeStyle} borderRadius={4} px={3} py={2}>
                {x.name}
              </Link>
            </NextLink>
          ))}
        </Stack>
      </Stack>
    </>
  );
};

const AdminLayout = ({ children }) => (
  <AuthWrapper type="admin">
    <MainLayout sidebar={<Sidebar />}>{children}</MainLayout>
  </AuthWrapper>
);

export default AdminLayout;
