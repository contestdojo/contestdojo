import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    Heading,
    HStack,
    IconButton,
    Stack,
    Tab,
    Table,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tbody,
    Td,
    Tfoot,
    Th,
    Thead,
    Tooltip,
    Tr,
} from "@chakra-ui/react";
import { useState } from "react";
import { CSVLink } from "react-csv";
import { IoAdd, IoRemove } from "react-icons/io5";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import EventProvider, { useEvent } from "~/contexts/EventProvider";
import EventForm from "~/forms/EventForm";
import { delay } from "~/helpers/utils";

const toDict = (obj, x) => {
    obj[x.id] = { ...x, ...obj[x.id] };
    return obj;
};

const sum = arr => arr.reduce((a, b) => a + b, 0);

const TableView = ({ cols, rows, filename }) => (
    <Stack spacing={4} alignItems="flex-start">
        <Button colorScheme="blue">
            <CSVLink data={rows} headers={cols} filename={filename}>
                Download CSV
            </CSVLink>
        </Button>
        <Table>
            <Thead>
                <Tr>{cols.map(col => !col.hide && <Th>{col.label}</Th>)}</Tr>
            </Thead>
            <Tbody>
                {rows.map(row => (
                    <Tr>{cols.map(col => !col.hide && <Td>{col.renderer?.(row) ?? row[col.key]}</Td>)}</Tr>
                ))}
            </Tbody>
            <Tfoot>
                <Tr>
                    <Td>
                        <b>Total</b>
                    </Td>
                    {cols.slice(1).map(
                        col =>
                            !col.hide && (
                                <Td>
                                    <b>{col.reducer?.(rows.map(row => row[col.key]))}</b>
                                </Td>
                            )
                    )}
                </Tr>
            </Tfoot>
        </Table>
    </Stack>
);

const Orgs = ({ event, orgs, onUpdate }) => {
    const cols = [
        { label: "Name", key: "name", renderer: row => <Tooltip label={`${row.address}`}>{row.name}</Tooltip> },
        { label: "Address", key: "address", hide: true },
        { label: "Contact", key: "admin" },
        { label: "Contact Email", key: "adminEmail" },
        { label: "# Teams Applied", key: "applyTeams", reducer: sum },
        { label: "Expected # Students", key: "expectedStudents", reducer: sum },
        {
            label: "# Teams Given",
            key: "maxTeams",
            renderer: row => (
                <HStack spacing={4}>
                    <IconButton
                        size="sm"
                        aria-label="Add Team"
                        icon={<IoRemove />}
                        onClick={() => onUpdate(row.id, { maxTeams: (row.maxTeams ?? 0) - 1 })}
                        disabled={(row.maxTeams ?? 0) <= 0}
                    />
                    <Box>{row.maxTeams ?? 0}</Box>
                    <IconButton
                        size="sm"
                        aria-label="Add Team"
                        icon={<IoAdd />}
                        onClick={() => onUpdate(row.id, { maxTeams: (row.maxTeams ?? 0) + 1 })}
                    />
                </HStack>
            ),
            reducer: sum,
        },
        {
            label: "Stage",
            key: "stage",
            renderer: row => {
                const stage = row.stage ?? event.defaultStage;
                return (
                    <ButtonGroup isAttached>
                        <Button
                            mr="-px"
                            {...(stage == "apply" ? { colorScheme: "blue" } : {})}
                            onClick={() => onUpdate(row.id, { stage: "apply" })}
                        >
                            Apply
                        </Button>
                        <Button
                            {...(stage == "teams" ? { colorScheme: "blue" } : {})}
                            onClick={() => onUpdate(row.id, { stage: "teams" })}
                        >
                            Teams
                        </Button>
                    </ButtonGroup>
                );
            },
        },
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
        stage: x.stage ?? event.defaultStage,
    }));

    return <TableView cols={cols} rows={rows} filename="organizations.csv" />;
};

const Teams = ({ teams, orgsById, studentsByTeam }) => {
    const cols = [
        { label: "Name", key: "name" },
        { label: "Organization", key: "org" },
        { label: "# Students", key: "numStudents", reducer: sum },
        { label: "# Waivers Signed", key: "numSigned", reducer: sum },
    ];

    const rows = teams.map(x => ({
        name: x.name,
        org: orgsById[x.org.id].name,
        numStudents: studentsByTeam[x.id]?.length ?? 0,
        numSigned: studentsByTeam[x.id]?.filter(x => x.waiverSigned)?.length ?? 0,
    }));

    return <TableView cols={cols} rows={rows} filename="teams.csv" />;
};

const Students = ({ students, teamsById, orgsById, onUpdate }) => {
    const cols = [
        { label: "Name", key: "name", renderer: row => <Tooltip label={`${row.email}`}>{row.name}</Tooltip> },
        { label: "Email", key: "email", hide: true },
        { label: "Parent Email", key: "parentEmail" },
        { label: "Organization", key: "org" },
        { label: "Team", key: "team" },
        {
            label: "Waiver signed?",
            key: "waiverSigned",
            renderer: row => (
                <Checkbox
                    isChecked={row.waiverSigned ?? false}
                    onChange={e => onUpdate(row.id, { waiverSigned: e.target.checked })}
                />
            ),
            reducer: sum,
        },
    ];

    const rows = students.map(x => ({
        id: x.id,
        name: `${x.fname} ${x.lname}`,
        email: x.email,
        parentEmail: x.parentEmail,
        org: orgsById[x.org.id].name,
        team: teamsById[x.team?.id]?.name,
        waiverSigned: !!x.waiverSigned,
    }));

    return <TableView cols={cols} rows={rows} filename="students.csv" />;
};

const EventContent = () => {
    // Data
    const firestore = useFirestore();
    const { ref: eventRef, data: event } = useEvent();

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
    const studentsById = students.reduce(toDict, {});

    // Make dicts

    const teamsByOrg = {};
    const studentsByTeam = {};
    const studentsByOrg = {};

    for (const team of teams) {
        const key = team.org?.id ?? null;
        if (!teamsByOrg.hasOwnProperty(key)) teamsByOrg[key] = [];
        teamsByOrg[key].push(team);
    }

    for (const student of students) {
        const teamKey = student.team?.id ?? null;
        if (!studentsByTeam.hasOwnProperty(teamKey)) studentsByTeam[teamKey] = [];
        studentsByTeam[teamKey].push(student);

        const orgKey = teamsById[student.team?.id]?.org?.id ?? null;
        if (!studentsByOrg.hasOwnProperty(orgKey)) studentsByOrg[orgKey] = [];
        studentsByOrg[orgKey].push(student);
    }

    // Form
    const [formState, setFormState] = useState({ isLoading: false, error: null });
    const handleUpdate = async ({ name, date, maxStudents, maxTeams }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await eventRef.update({
                name,
                maxStudents,
                maxTeams,
            });
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    // Update handlers

    const handleOrgUpdate = async (id, update) => {
        await eventOrgsRef.doc(id).update(update);
    };

    const handleStudentUpdate = async (id, update) => {
        await studentsRef.doc(id).update(update);
    };

    return (
        <Stack spacing={6} flex={1}>
            <Heading>{event.name}</Heading>
            <Tabs>
                <TabList>
                    <Tab>Organizations</Tab>
                    <Tab>Teams</Tab>
                    <Tab>Students</Tab>
                    <Tab>Tests</Tab>
                    <Tab>Event Details</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        <Orgs
                            event={event}
                            orgs={Object.values(orgsById)}
                            teamsByOrg={teamsByOrg}
                            studentsByOrg={studentsByOrg}
                            onUpdate={handleOrgUpdate}
                        />
                    </TabPanel>
                    <TabPanel>
                        <Teams teams={teams} orgsById={orgsById} studentsByTeam={studentsByTeam} />
                    </TabPanel>
                    <TabPanel>
                        <Students
                            students={students}
                            teamsById={teamsById}
                            orgsById={orgsById}
                            onUpdate={handleStudentUpdate}
                        />
                    </TabPanel>
                    <TabPanel>Tests</TabPanel>
                    <TabPanel>
                        <Box maxWidth={600}>
                            <EventForm
                                key={event.id}
                                onSubmit={handleUpdate}
                                buttonText="Update Event"
                                defaultValues={event}
                                {...formState}
                            />
                        </Box>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Stack>
    );
};

const Event = () => (
    <EventProvider>
        <EventContent />
    </EventProvider>
);

export default Event;
