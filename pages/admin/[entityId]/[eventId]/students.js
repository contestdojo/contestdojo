/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Button, ButtonGroup } from "@chakra-ui/react";
import { useState } from "react";
import { HiDownload } from "react-icons/hi";
import { useFirestore, useFirestoreCollectionData, useStorage } from "reactfire";

import { useEvent } from "~/components/contexts/EventProvider";
import { useImpersonate } from "~/helpers/utils";

import AdminTableView, {
  countReducer,
  iconButtonRenderer,
  updateRenderer,
} from "../../../../components/AdminTableView";

const toDict = (obj, x) => {
  obj[x.id] = { ...x, ...obj[x.id] };
  return obj;
};

const StudentsTable = ({ students, customFields, teamsById, orgsById, onUpdate, extraButtons }) => {
  const impersonate = useImpersonate();
  const storage = useStorage();
  const root = storage.ref();

  const cols = [
    { label: "ID", key: "id", hideByDefault: true },
    { label: "Number", key: "number", renderer: updateRenderer(onUpdate, "number") },
    {
      label: "Name",
      key: "name",
      renderer: updateRenderer(onUpdate, (val) => {
        let splits = val.split(" ", 2);
        return { fname: splits[0], lname: splits[1] };
      }),
    },
    { label: "Email", key: "email", hideByDefault: true },
    { label: "Grade", key: "grade" },
    { label: "Organization", key: "org" },
    { label: "Team", key: "team" },
    {
      label: "Waiver",
      key: "waiver",
      renderer: iconButtonRenderer(HiDownload, Boolean, async (val) =>
        window.open(await root.child(val).getDownloadURL(), "_blank")
      ),
      reducer: countReducer,
      hideInCsv: true,
    },
    {
      label: "Score Report",
      key: "scoreReport",
      renderer: iconButtonRenderer(HiDownload, Boolean, async (val) =>
        window.open(await root.child(val).getDownloadURL(), "_blank")
      ),
      reducer: countReducer,
      hideInCsv: true,
    },
    { label: "Notes", key: "notes", hideByDefault: true, renderer: updateRenderer(onUpdate, "notes") },
    {
      label: "Impersonate",
      key: "impersonate",
      renderer: (_, row) => (
        <Button variant="outline" size="xs" onClick={() => impersonate(row.id)}>
          Impersonate
        </Button>
      ),
      hideInCsv: true,
      hideByDefault: true,
    },
    ...customFields.map((x) => ({
      label: `[Custom] ${x.label}`,
      key: `custom_${x.id}`,
      hideByDefault: true,
    })),
  ];

  const rows = students.map((x) => {
    const team = teamsById[x.team?.id];
    const org = orgsById[x.org?.id];

    return {
      id: x.id,
      number: x.number ?? "",
      name: `${x.fname} ${x.lname}`,
      email: x.email,
      grade: x.grade,
      org: org?.name,
      team: team?.name ?? "",
      waiver: x.waiver,
      scoreReport: x.scoreReport,
      notes: x.notes ?? "",
      ...Object.fromEntries(customFields.map((f) => [`custom_${f.id}`, x.customFields?.[f.id]])),
    };
  });

  return <AdminTableView cols={cols} rows={rows} defaultSortKey="number" filename="students.csv" extraButtons={extraButtons} />;
};

const StudentsTab = () => {
  const firestore = useFirestore();
  const { data: event, ref: eventRef } = useEvent();

  // Get orgs
  const eventOrgsRef = eventRef.collection("orgs");
  const { data: eventOrgs } = useFirestoreCollectionData(eventOrgsRef, { idField: "id" });
  let orgsById = eventOrgs.reduce(toDict, {});

  const rootOrgsRef = firestore.collection("orgs");
  const { data: rootOrgs } = useFirestoreCollectionData(rootOrgsRef, { idField: "id" });
  orgsById = rootOrgs.reduce(toDict, orgsById);

  // Get teams
  const teamsRef = eventRef.collection("teams");
  const { data: teams } = useFirestoreCollectionData(teamsRef, { idField: "id" });
  const teamsById = teams.reduce(toDict, {});

  // Get students
  const studentsRef = eventRef.collection("students");
  let { data: students } = useFirestoreCollectionData(studentsRef, { idField: "id" });

  // Get pending students
  const pendingStudentsRef = eventRef.collection("pending-students");
  let { data: pendingStudents } = useFirestoreCollectionData(pendingStudentsRef, { idField: "id" });

  const handleStudentUpdate = async (id, update) => {
    await studentsRef.doc(id).update(update);
  };

  const handlePendingStudentUpdate = async (id, update) => {
    await pendingStudentsRef.doc(id).update(update);
  };

  const [view, setView] = useState("students");

  const viewToggle = (
    <ButtonGroup size="md" isAttached variant="outline">
      <Button
        colorScheme={view === "students" ? "blue" : undefined}
        variant={view === "students" ? "solid" : "outline"}
        onClick={() => setView("students")}
      >
        Students ({students.length})
      </Button>
      <Button
        colorScheme={view === "pending" ? "blue" : undefined}
        variant={view === "pending" ? "solid" : "outline"}
        onClick={() => setView("pending")}
      >
        Pending ({pendingStudents.length})
      </Button>
    </ButtonGroup>
  );

  return view === "students" ? (
    <StudentsTable
      students={students}
      customFields={event.customFields ?? []}
      teamsById={teamsById}
      orgsById={orgsById}
      onUpdate={handleStudentUpdate}
      extraButtons={viewToggle}
    />
  ) : (
    <StudentsTable
      students={pendingStudents}
      customFields={event.customFields ?? []}
      teamsById={teamsById}
      orgsById={orgsById}
      onUpdate={handlePendingStudentUpdate}
      extraButtons={viewToggle}
    />
  );
};

export default StudentsTab;
