import {
    Box,
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
    Th,
    Thead,
    Tr,
} from "@chakra-ui/react";
import firebase from "firebase";
import { useState } from "react";
import { IoAdd, IoRemove } from "react-icons/io5";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import EventForm from "~/forms/EventForm";
import { delay, useEventData } from "~/helpers/utils";

const toDict = (obj, x) => {
    obj[x.id] = { ...x, ...obj[x.id] };
    return obj;
};

const Orgs = ({ orgs, handleGiveTeams }) => {
    return (
        <Table>
            <Thead>
                <Tr>
                    <Th>Name</Th>
                    <Th>Contact</Th>
                    <Th>Contact Email</Th>
                    <Th>Address</Th>
                    <Th># Teams Applied</Th>
                    <Th>Expected # Students</Th>
                    <Th># Teams Given</Th>
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
                            {x.address}, {x.city}, {x.state}, {x.country} {x.zip}
                        </Td>
                        <Td>{x.applyTeams}</Td>
                        <Td>{x.expectedStudents}</Td>
                        <Td>
                            <HStack spacing={4}>
                                <IconButton
                                    size="sm"
                                    aria-label="Add Team"
                                    icon={<IoRemove />}
                                    onClick={() => handleGiveTeams(x.id, -1)}
                                />
                                <Box>{x.maxTeams ?? 0}</Box>
                                <IconButton
                                    size="sm"
                                    aria-label="Add Team"
                                    icon={<IoAdd />}
                                    onClick={() => handleGiveTeams(x.id, 1)}
                                />
                            </HStack>
                        </Td>
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

    const eventOrgsRef = eventRef.collection("orgs");
    const { data: eventOrgs } = useFirestoreCollectionData(eventOrgsRef, { idField: "id" });
    let orgsById = eventOrgs.reduce(toDict, {});

    const rootOrgsRef = firestore
        .collection("orgs")
        .where(firebase.firestore.FieldPath.documentId(), "in", [...Object.keys(orgsById), "0"]);
    const { data: rootOrgs } = useFirestoreCollectionData(rootOrgsRef, { idField: "id" });
    orgsById = rootOrgs.reduce(toDict, orgsById);

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

    // Give teams

    const handleGiveTeams = async (id, inc) => {
        await delay(300);
        await eventOrgsRef.doc(id).update({
            maxTeams: firebase.firestore.FieldValue.increment(inc),
        });
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
                            handleGiveTeams={handleGiveTeams}
                        />
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
