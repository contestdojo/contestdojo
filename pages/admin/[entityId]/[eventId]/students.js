import { Checkbox } from "@chakra-ui/react";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import AdminTableView, { sumReducer, updateRenderer } from "~/components/AdminTableView";
import { useEvent } from "~/components/contexts/EventProvider";

const toDict = (obj, x) => {
    obj[x.id] = { ...x, ...obj[x.id] };
    return obj;
};

const StudentsTable = ({ students, teamsById, orgsById, onUpdate }) => {
    const cols = [
        { label: "ID", key: "id", hideByDefault: true },
        {
            label: "Name",
            key: "name",
            renderer: updateRenderer(onUpdate, val => {
                let splits = val.split(" ", 2);
                return { fname: splits[0], lname: splits[1] };
            }),
        },
        { label: "Email", key: "email", hideByDefault: true },
        { label: "Parent Email", key: "parentEmail", renderer: updateRenderer(onUpdate, "parentEmail") },
        { label: "Birthdate", key: "birthdate", renderer: updateRenderer(onUpdate, "birthdate") },
        { label: "Gender", key: "gender", renderer: updateRenderer(onUpdate, "gender") },
        { label: "Organization", key: "org" },
        { label: "Team", key: "team" },
        {
            label: "Waiver sent?",
            key: "waiverSent",
            renderer: (val, { id }) => (
                <Checkbox isChecked={val} onChange={e => onUpdate(id, { waiverSent: e.target.checked })} />
            ),
            reducer: sumReducer,
        },
        {
            label: "Waiver signed?",
            key: "waiverSigned",
            renderer: (val, { id }) => (
                <Checkbox isChecked={val} onChange={e => onUpdate(id, { waiverSigned: e.target.checked })} />
            ),
            reducer: sumReducer,
        },
        { label: "Notes", key: "notes", hideByDefault: true, renderer: updateRenderer(onUpdate, "notes") },
    ];

    const rows = students.map(x => ({
        id: x.id,
        name: `${x.fname} ${x.lname}`,
        email: x.email,
        parentEmail: x.parentEmail ?? "",
        birthdate: x.birthdate ?? "",
        gender: x.gender ?? "",
        org: orgsById[x.org.id].name,
        team: teamsById[x.team?.id]?.name ?? "",
        waiverSigned: !!x.waiverSigned,
        waiverSent: !!x.waiverSent,
        notes: x.notes ?? "",
    }));

    return (
        <AdminTableView
            cols={cols}
            rows={rows}
            defaultSortKey="name"
            filename="students.csv"
            tableProps={{ size: "sm" }}
        />
    );
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
    orgsById = rootOrgs.filter(x => orgsById.hasOwnProperty(x.id)).reduce(toDict, orgsById);

    // Get teams
    const teamsRef = eventRef.collection("teams");
    const { data: teams } = useFirestoreCollectionData(teamsRef, { idField: "id" });
    const teamsById = teams.reduce(toDict, {});

    // Get students
    const studentsRef = eventRef.collection("students");
    let { data: students } = useFirestoreCollectionData(studentsRef, { idField: "id" });

    const handleStudentUpdate = async (id, update) => {
        await studentsRef.doc(id).update(update);
    };

    return (
        <StudentsTable students={students} teamsById={teamsById} orgsById={orgsById} onUpdate={handleStudentUpdate} />
    );
};

export default TeamsTab;
