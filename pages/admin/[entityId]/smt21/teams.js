import { useFirestore, useFirestoreCollectionData } from "reactfire";

import AdminTableView, { sumReducer, updateRenderer } from "~/components/AdminTableView";
import { useEvent } from "~/components/contexts/EventProvider";

const toDict = (obj, x) => {
  obj[x.id] = { ...x, ...obj[x.id] };
  return obj;
};

const TeamsTable = ({ teams, orgsById, studentsByTeam, onUpdate }) => {
  const cols = [
    { label: "ID", key: "id", hideByDefault: true },
    { label: "Number", key: "number", renderer: updateRenderer(onUpdate, "number") },
    { label: "Name", key: "name", renderer: updateRenderer(onUpdate, "name") },
    { label: "Organization", key: "org" },
    { label: "Division", key: "division" },
    { label: "# Students", key: "numStudents", reducer: sumReducer },
    { label: "# Waivers Signed", key: "numSigned", reducer: sumReducer },
    { label: "Notes", key: "notes", hideByDefault: true, renderer: updateRenderer(onUpdate, "notes") },
  ];

  const rows = teams.map((x) => ({
    id: x.id,
    number: x.number ?? "",
    name: x.name,
    org: orgsById[x.org.id]?.name,
    division: x.division == 0 ? "Tree" : "Sapling",
    numStudents: studentsByTeam[x.id]?.length ?? 0,
    numSigned: studentsByTeam[x.id]?.filter((x) => x.waiverSigned)?.length ?? 0,
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
