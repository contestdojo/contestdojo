import {
    Box,
    Heading,
    Stack,
    Tab,
    Table,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from "@chakra-ui/react";
import { useState } from "react";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import EventForm from "~/forms/EventForm";
import { delay, useEventData } from "~/helpers/utils";

const toDict = (obj, x) => {
    obj[x.id] = x;
    return obj;
};

const Orgs = ({ orgs, teamsByOrg, studentsByOrg }) => {
    return (
        <Table>
            <Thead>
                <Tr>
                    <Th>Name</Th>
                    <Th>Contact</Th>
                    <Th>Contact Email</Th>
                    <Th>Address</Th>
                    <Th># Teams</Th>
                    <Th># Students</Th>
                </Tr>
            </Thead>
            <Tbody>
                {orgs.map(x => (
                    <Tr>
                        <Td>{x.name}</Td>
                        <Td>
                            {x.adminData?.fname} {x.adminData?.lname}
                        </Td>
                        <Td>{x.adminData?.email}</Td>
                        <Td>
                            {x.address}, {x.city}, {x.state} {x.zip}
                        </Td>
                        <Td>{teamsByOrg[x.id]?.length ?? 0}</Td>
                        <Td>{studentsByOrg[x.id]?.length ?? 0}</Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

const Teams = ({ teams, orgsById, studentsByTeam }) => {
    return (
        <Table>
            <Thead>
                <Tr>
                    <Th>Name</Th>
                    <Th>Organization</Th>
                    <Th># Students</Th>
                </Tr>
            </Thead>
            <Tbody>
                {teams.map(x => (
                    <Tr>
                        <Td>{x.name}</Td>
                        <Td>{orgsById[x.org.id].name}</Td>
                        <Td>{studentsByTeam[x.id]?.length ?? 0}</Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

const Students = ({ students, teamsById, orgsById }) => {
    return (
        <Table>
            <Thead>
                <Tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Organization</Th>
                    <Th>Team</Th>
                </Tr>
            </Thead>
            <Tbody>
                {students.map(x => (
                    <Tr>
                        <Td>
                            {x.fname} {x.lname}
                        </Td>
                        <Td>{x.email}</Td>
                        <Td>{orgsById[x.org.id].name}</Td>
                        <Td>{teamsById[x.team?.id]?.name}</Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

const Event = () => {
    // Data
    const firestore = useFirestore();
    const { ref: eventRef, data: event } = useEventData();

    // Get orgs
    const orgsRef = firestore.collection("orgs");
    const { data: orgs } = useFirestoreCollectionData(orgsRef, { idField: "id" });
    const orgsById = orgs.reduce(toDict, {});

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
                        <Orgs orgs={orgs} teamsByOrg={teamsByOrg} studentsByOrg={studentsByOrg} />
                    </TabPanel>
                    <TabPanel>
                        <Teams teams={teams} orgsById={orgsById} studentsByTeam={studentsByTeam} />
                    </TabPanel>
                    <TabPanel>
                        <Students students={students} teamsById={teamsById} orgsById={orgsById} />
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

export default Event;
