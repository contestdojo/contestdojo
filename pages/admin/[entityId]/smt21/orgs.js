import { Button, ButtonGroup } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import AdminTableView, {
    addRemoveRenderer,
    dayjsRenderer,
    sumReducer,
    updateRenderer,
} from "~/components/AdminTableView";
import { useEvent } from "~/components/contexts/EventProvider";
import { toDict } from "~/helpers/utils";

const stageRenderer = onUpdate => (val, { id }) => (
    <ButtonGroup isAttached size="sm">
        <Button
            mr="-px"
            {...(val == "apply" ? { colorScheme: "blue" } : {})}
            onClick={() => onUpdate(id, { stage: "apply" })}
        >
            Apply
        </Button>
        <Button {...(val == "teams" ? { colorScheme: "blue" } : {})} onClick={() => onUpdate(id, { stage: "teams" })}>
            Teams
        </Button>
    </ButtonGroup>
);

const OrgsTable = ({ event, orgs, onUpdate }) => {
    const cols = [
        { label: "ID", key: "id", hideByDefault: true },
        { label: "Name", key: "name", renderer: updateRenderer(onUpdate, "name") },
        { label: "Address", key: "address", hideByDefault: true },
        { label: "Contact", key: "admin", hideByDefault: true },
        { label: "Contact Email", key: "adminEmail", hideByDefault: true },
        { label: "# Teams Applied", key: "applyTeams", reducer: sumReducer },
        { label: "Expected # Students", key: "expectedStudents", reducer: sumReducer },
        { label: "# Tree Teams", key: "maxTeams", renderer: addRemoveRenderer(onUpdate, "Team"), reducer: sumReducer },
        {
            label: "# Sapling Teams",
            key: "maxTeamsSapling",
            renderer: addRemoveRenderer(onUpdate, "Team"),
            reducer: sumReducer,
        },
        {
            label: "# Paid Students",
            key: "paidStudents",
            renderer: addRemoveRenderer(onUpdate, "Student"),
            reducer: sumReducer,
        },
        { label: "Stage", key: "stage", renderer: stageRenderer(onUpdate) },
        { label: "Start Time", key: "startTime", hideByDefault: true, renderer: dayjsRenderer },
        { label: "Last Update Time", key: "updateTime", hideByDefault: true, renderer: dayjsRenderer },
        { label: "Notes", key: "notes", hideByDefault: true, renderer: updateRenderer(onUpdate, "notes") },
    ];

    const rows = orgs.map(x => ({
        id: x.id,
        name: x.name,
        address: `${x.address}, ${x.city}, ${x.state}, ${x.country} ${x.zip}`,
        admin: `${x.adminData?.fname} ${x.adminData?.lname}`,
        adminEmail: x.adminData?.email,
        applyTeams: x.applyTeams,
        expectedStudents: x.expectedStudents,
        maxTeams: x.maxTeams ?? 0,
        maxTeamsSapling: x.maxTeamsSapling ?? 0,
        paidStudents: x.paidStudents ?? 0,
        stage: x.stage ?? event.defaultStage,
        startTime: dayjs.unix(x.startTime.seconds),
        updateTime: dayjs.unix(x.updateTime.seconds),
        notes: x.notes ?? "",
    }));

    return <AdminTableView cols={cols} rows={rows} defaultSortKey="name" filename="organizations.csv" />;
};

const OrgsTab = () => {
    const firestore = useFirestore();
    const { ref: eventRef, data: event } = useEvent();

    const eventOrgsRef = eventRef.collection("orgs");
    const { data: eventOrgs } = useFirestoreCollectionData(eventOrgsRef, { idField: "id" });
    let orgsById = eventOrgs.reduce(toDict, {});

    const rootOrgsRef = firestore.collection("orgs");
    const { data: rootOrgs } = useFirestoreCollectionData(rootOrgsRef, { idField: "id" });
    orgsById = rootOrgs.filter(x => orgsById.hasOwnProperty(x.id)).reduce(toDict, orgsById);

    const handleOrgUpdate = async (id, update) => {
        await eventOrgsRef.doc(id).update(update);
    };

    return <OrgsTable event={event} orgs={Object.values(orgsById)} onUpdate={handleOrgUpdate} />;
};

export default OrgsTab;
