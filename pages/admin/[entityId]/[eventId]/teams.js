/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { HiDownload } from "react-icons/hi";
import { useFirestore, useFirestoreCollectionData, useStorage } from "reactfire";

import AdminTableView, {
  countReducer,
  iconButtonRenderer,
  sumReducer,
  updateRenderer,
} from "../../../../components/AdminTableView";

import { useEvent } from "~/components/contexts/EventProvider";

const toDict = (obj, x) => {
  obj[x.id] = { ...x, ...obj[x.id] };
  return obj;
};

const TeamsTable = ({ teams, orgsById, studentsByTeam, onUpdate }) => {
  const storage = useStorage();
  const root = storage.ref();

  const cols = [
    { label: "ID", key: "id", hideByDefault: true },
    { label: "Number", key: "number", renderer: updateRenderer(onUpdate, "number") },
    { label: "Name", key: "name", renderer: updateRenderer(onUpdate, "name") },
    { label: "Organization", key: "org" },
    { label: "# Students", key: "numStudents", reducer: sumReducer },
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
  ];

  const rows = teams.map((x) => ({
    id: x.id,
    number: x.number ?? "",
    name: x.name,
    org: orgsById[x.org.id]?.name,
    numStudents: studentsByTeam[x.id]?.length ?? 0,
    scoreReport: x.scoreReport,
    notes: x.notes ?? "",
  }));

  return <AdminTableView cols={cols} rows={rows} defaultSortKey="number" filename="teams.csv" />;
};

const TeamsTab = () => {
  const firestore = useFirestore();
  const { ref: eventRef } = useEvent();

  // Get orgs

  const eventOrgsRef = eventRef.collection("orgs");
  const { data: eventOrgs } = useFirestoreCollectionData(eventOrgsRef, { idField: "id" });
  let orgsById = eventOrgs.reduce(toDict, {});

  const rootOrgsRef = firestore.collection("orgs");
  const { data: rootOrgs } = useFirestoreCollectionData(rootOrgsRef, { idField: "id" });
  orgsById = rootOrgs.filter((x) => orgsById.hasOwnProperty(x.id)).reduce(toDict, orgsById);

  // Get teams
  const teamsRef = eventRef.collection("teams");
  const { data: teams } = useFirestoreCollectionData(teamsRef, { idField: "id" });

  // Get students
  const studentsRef = eventRef.collection("students");
  let { data: students } = useFirestoreCollectionData(studentsRef, { idField: "id" });

  // Make dict
  const studentsByTeam = {};
  for (const student of students) {
    const teamKey = student.team?.id ?? null;
    if (!studentsByTeam.hasOwnProperty(teamKey)) studentsByTeam[teamKey] = [];
    studentsByTeam[teamKey].push(student);
  }

  const handleTeamUpdate = async (id, update) => {
    await teamsRef.doc(id).update(update);
  };

  return <TeamsTable teams={teams} orgsById={orgsById} studentsByTeam={studentsByTeam} onUpdate={handleTeamUpdate} />;
};

export default TeamsTab;
