/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Button, HStack, Text } from "@chakra-ui/react";
import { useFirestore, useFirestoreCollectionData } from "reactfire";

import AdminTableView, { addRemoveRenderer, sumReducer, updateRenderer } from "~/components/AdminTableView";
import { useEvent } from "~/components/contexts/EventProvider";
import { toDict, useImpersonate } from "~/helpers/utils";

const OrgsTable = ({ event, orgs, studentsByOrg, onUpdate }) => {
  const impersonate = useImpersonate();

  const cols = [
    { label: "ID", key: "id", hideByDefault: true },
    { label: "Name", key: "name", renderer: updateRenderer(onUpdate, "name") },
    { label: "Address", key: "address", hideByDefault: true },
    { label: "Contact", key: "admin" },
    { label: "Contact Email", key: "adminEmail" },
    event.costPerStudent
      ? {
          label: "# Seats Purchased",
          key: "maxStudents",
          renderer: addRemoveRenderer(onUpdate, "maxStudents"),
          reducer: sumReducer,
        }
      : undefined,
    { label: "# Students Added", key: "numStudents", reducer: sumReducer },
    {
      label: "# Students Assigned",
      key: "numStudentsAssigned",
      renderer: event.costPerStudent
        ? (val, row) => (
            <HStack>
              <Text>{val}</Text>
              <Text fontSize="xs" color={row.maxStudents === val ? "gray.300" : "red.300"}>
                {row.maxStudents - val} left
              </Text>
            </HStack>
          )
        : undefined,
      reducer: sumReducer,
    },
    { label: "Notes", key: "notes", renderer: updateRenderer(onUpdate, "notes") },
    {
      label: "Impersonate",
      key: "impersonate",
      renderer: (_, row) => (
        <Button variant="outline" size="xs" onClick={() => impersonate(row.adminId)}>
          Impersonate
        </Button>
      ),
      hideInCsv: true,
      hideByDefault: true,
    },
  ];

  const rows = orgs.map((x) => ({
    id: x.id,
    name: x.name,
    address: `${x.address}, ${x.city}, ${x.state}, ${x.country} ${x.zip}`,
    admin: `${x.adminData?.fname} ${x.adminData?.lname}`,
    adminEmail: x.adminData?.email,
    adminId: x.admin.id,
    maxStudents: x.maxStudents ?? 0,
    numStudents: studentsByOrg[x.id]?.length ?? 0,
    numStudentsAssigned: studentsByOrg[x.id]?.filter((x) => x.team)?.length ?? 0,
    notes: x.notes ?? "",
  }));

  return (
    <AdminTableView
      cols={cols.filter((x) => x !== undefined)}
      rows={rows}
      defaultSortKey="name"
      filename="organizations.csv"
    />
  );
};

const OrgsTab = () => {
  const firestore = useFirestore();
  const { ref: eventRef, data: event } = useEvent();

  const eventOrgsRef = eventRef.collection("orgs");
  const { data: eventOrgs } = useFirestoreCollectionData(eventOrgsRef, { idField: "id" });
  let orgsById = eventOrgs.reduce(toDict, {});

  const rootOrgsRef = firestore.collection("orgs");
  const { data: rootOrgs } = useFirestoreCollectionData(rootOrgsRef, { idField: "id" });
  orgsById = rootOrgs.filter((x) => orgsById.hasOwnProperty(x.id)).reduce(toDict, orgsById);

  const studentsRef = eventRef.collection("students");
  const { data: students } = useFirestoreCollectionData(studentsRef, { idField: "id" });
  const studentsByOrg = students.reduce((acc, obj) => {
    if (!acc[obj.org.id]) acc[obj.org.id] = [];
    acc[obj.org.id].push(obj);
    return acc;
  }, {});

  const handleOrgUpdate = async (id, update) => {
    await eventOrgsRef.doc(id).update(update);
  };

  return (
    <OrgsTable event={event} orgs={Object.values(orgsById)} studentsByOrg={studentsByOrg} onUpdate={handleOrgUpdate} />
  );
};

export default OrgsTab;
