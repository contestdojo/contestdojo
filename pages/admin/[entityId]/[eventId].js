import {
    Box,
    Button,
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
    VStack,
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

const Orgs = ({ orgs, onUpdate }) => {
    const headers = [
        { label: "Name", key: "name" },
        { label: "Address", key: "name" },
        { label: "Contact", key: "admin" },
        { label: "Contact Email", key: "adminEmail" },
        { label: "# Teams Applied", key: "applyTeams" },
        { label: "Expected # Students", key: "expectedStudents" },
        { label: "# Teams Given", key: "maxTeams" },
    ];
    const rows = orgs.map(x => ({
        name: x.name,
        address: `${x.address}, ${x.city}, ${x.state}, ${x.country} ${x.zip}`,
        admin: `${x.adminData?.fname} ${x.adminData?.lname}`,
        adminEmail: x.adminData?.email,
        applyTeams: x.applyTeams,
        expectedStudents: x.expectedStudents,
        maxTeams: x.maxTeams,
    }));

    return (
        <Stack spacing={4} alignItems="flex-start">
            <Button colorScheme="blue">
                <CSVLink data={rows} headers={headers} filename="organizations.csv">
                    Download CSV
                </CSVLink>
            </Button>
            <Table>
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>Contact</Th>
                        <Th>Contact Email</Th>
                        <Th># Teams Applied</Th>
                        <Th>Expected # Students</Th>
                        <Th># Teams Given</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {orgs.map(x => (
                        <Tr>
                            <Td>
                                <Tooltip label={`${x.address}, ${x.city}, ${x.state}, ${x.country} ${x.zip}`}>
                                    {x.name}
                                </Tooltip>
                            </Td>
                            <Td>
                                {x.adminData?.fname} {x.adminData?.lname}
                            </Td>
                            <Td>{x.adminData?.email}</Td>
                            <Td>{x.applyTeams}</Td>
                            <Td>{x.expectedStudents}</Td>
                            <Td>
                                <HStack spacing={4}>
                                    <IconButton
                                        size="sm"
                                        aria-label="Add Team"
                                        icon={<IoRemove />}
                                        onClick={() => onUpdate(x.id, { maxTeams: (x.maxTeams ?? 0) - 1 })}
                                        disabled={(x.maxTeams ?? 0) <= 0}
                                    />
                                    <Box>{x.maxTeams ?? 0}</Box>
                                    <IconButton
                                        size="sm"
                                        aria-label="Add Team"
                                        icon={<IoAdd />}
                                        onClick={() => onUpdate(x.id, { maxTeams: (x.maxTeams ?? 0) + 1 })}
                                    />
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
                <Tfoot>
                    <Tr>
                        <Th>Total</Th>
                        <Td />
                        <Td />
                        <Td>{orgs.map(x => x.applyTeams).reduce((a, b) => a + b, 0)}</Td>
                        <Td>{orgs.map(x => x.expectedStudents).reduce((a, b) => a + b, 0)}</Td>
                        <Td>{orgs.map(x => x.maxTeams ?? 0).reduce((a, b) => a + b, 0)}</Td>
                    </Tr>
                </Tfoot>
            </Table>
        </Stack>
    );
};

const Teams = ({ teams, orgsById, studentsByTeam }) => {
    const headers = [
        { label: "Name", key: "name" },
        { label: "Organization", key: "org" },
        { label: "# Students", key: "numStudents" },
        { label: "# Waivers Signed", key: "numSigned" },
    ];
    const rows = teams.map(x => ({
        name: x.name,
        org: orgsById[x.org.id].name,
        numStudents: studentsByTeam[x.id]?.length ?? 0,
        numSigned: studentsByTeam[x.id]?.filter(x => x.waiverSigned)?.length ?? 0,
    }));

    return (
        <Stack spacing={4} alignItems="flex-start">
            <Button colorScheme="blue">
                <CSVLink data={rows} headers={headers} filename="teams.csv">
                    Download CSV
                </CSVLink>
            </Button>
            <Table>
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>Organization</Th>
                        <Th># Students</Th>
                        <Th># Waivers Signed</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {teams.map(x => (
                        <Tr>
                            <Td>{x.name}</Td>
                            <Td>{orgsById[x.org.id].name}</Td>
                            <Td>{studentsByTeam[x.id]?.length ?? 0}</Td>
                            <Td>{studentsByTeam[x.id]?.filter(x => x.waiverSigned)?.length ?? 0}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Stack>
    );
};

const Students = ({ students, teamsById, orgsById, onUpdate }) => {
    const headers = [
        { label: "Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Parent Email", key: "parentEmail" },
        { label: "Organization", key: "org" },
        { label: "Team", key: "team" },
        { label: "Waiver signed?", key: "waiverSigned" },
    ];
    const rows = students.map(x => ({
        name: `${x.fname} ${x.lname}`,
        email: x.email,
        parentEmail: x.parentEmail,
        org: orgsById[x.org.id].name,
        team: teamsById[x.team?.id]?.name,
        waiverSigned: !!x.waiverSigned,
    }));

    return (
        <Stack spacing={4} alignItems="flex-start">
            <Button colorScheme="blue">
                <CSVLink data={rows} headers={headers} filename="students.csv">
                    Download CSV
                </CSVLink>
            </Button>
            <Table>
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Parent Email</Th>
                        <Th>Organization</Th>
                        <Th>Team</Th>
                        <Th>Waiver signed?</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {students.map(x => (
                        <Tr>
                            <Td>
                                {x.fname} {x.lname}
                            </Td>
                            <Td>{x.email}</Td>
                            <Td>{x.parentEmail}</Td>
                            <Td>{orgsById[x.org.id].name}</Td>
                            <Td>{teamsById[x.team?.id]?.name}</Td>
                            <Td>
                                <Checkbox
                                    isChecked={x.waiverSigned ?? false}
                                    onChange={e => onUpdate(x.id, { waiverSigned: e.target.checked })}
                                />
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Stack>
    );
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
