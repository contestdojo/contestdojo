import {
    Box,
    Button,
    Divider,
    Heading,
    HStack,
    SimpleGrid,
    Stack,
    Text,
    Tooltip,
    useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { useFirestoreCollectionData } from "reactfire";
import AddStudentModal from "~/components/AddStudentModal";
import AddTeamModal from "~/components/AddTeamModal";
import { delay, useEventData, useOrgData } from "~/helpers/utils";

const StudentCard = ({ fname, lname, email }) => {
    return (
        <Box borderWidth={1} borderRadius="md" p={4}>
            <Heading as="h4" size="md">
                {fname} {lname}
            </Heading>
            <Text>{email}</Text>
        </Box>
    );
};

const TeamCard = ({ name }) => {
    return (
        <Box flex={1} borderWidth={1} borderRadius="md" p={4}>
            <Heading as="h4" size="md">
                {name}
            </Heading>
            <Text></Text>
        </Box>
    );
};

const Teams = ({ event, teams, onAddTeam }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [formState, setFormState] = useState({ isLoading: false, error: null });

    const handleAddTeam = async values => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await onAddTeam(values);
            setFormState({ isLoading: false, error: null });
            onClose();
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    return (
        <>
            <Heading size="lg">Teams</Heading>
            {teams.length > 0 && (
                <HStack direction="row" spacing={4}>
                    {teams.map(x => (
                        <TeamCard key={x.id} {...x} />
                    ))}
                </HStack>
            )}
            {teams.length < event.maxTeams ? (
                <Button colorScheme="blue" alignSelf="flex-start" onClick={onOpen}>
                    Add Team
                </Button>
            ) : (
                <Tooltip label="You cannot add more teams.">
                    <Box alignSelf="flex-start">
                        <Button colorScheme="blue" disabled>
                            Add Team
                        </Button>
                    </Box>
                </Tooltip>
            )}
            <AddTeamModal isOpen={isOpen} onClose={onClose} onSubmit={handleAddTeam} {...formState} />
        </>
    );
};

const Students = ({ students, onAddStudent }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [formState, setFormState] = useState({ isLoading: false, error: null });

    const handleAddStudent = async values => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await onAddStudent(values);
            setFormState({ isLoading: false, error: null });
            onClose();
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    return (
        <>
            <Heading size="lg">Unassigned Students</Heading>
            <SimpleGrid minChildWidth={300} spacing={4}>
                {students.map(x => (
                    <StudentCard key={x.id} {...x} />
                ))}
            </SimpleGrid>
            <Button colorScheme="blue" alignSelf="flex-start" onClick={onOpen}>
                Add Student
            </Button>
            <AddStudentModal isOpen={isOpen} onClose={onClose} onSubmit={handleAddStudent} {...formState} />
        </>
    );
};

const Event = () => {
    const { ref: orgRef, data: org } = useOrgData();
    const { ref: eventRef, data: event } = useEventData();

    // Get teams
    const teamsRef = eventRef.collection("teams");
    const { data: teams } = useFirestoreCollectionData(teamsRef.where("org", "==", orgRef), { idField: "id" });

    // Get students
    const studentsRef = eventRef.collection("students");
    const { data: students } = useFirestoreCollectionData(studentsRef.where("org", "==", orgRef), { idField: "id" });

    // Collapse into dict
    const studentsByTeam = {};
    for (const student of students) {
        const key = student.team?.id ?? null;
        if (!studentsByTeam.hasOwnProperty(key)) studentsByTeam[key] = [];
        studentsByTeam[key].push(student);
    }

    const handleAddTeam = async ({ name }) => {
        await teamsRef.add({ name: name, org: orgRef });
    };

    const handleAddStudent = async ({ fname, lname, email }) => {
        await studentsRef.add({ fname, lname, email, org: orgRef });
    };

    return (
        <Stack spacing={6} flex={1}>
            <HStack alignItems="flex-end" spacing={6}>
                <Heading size="2xl">{event.name}</Heading>
                <Heading size="lg">{org.name}</Heading>
            </HStack>
            <Divider />
            <Teams event={event} teams={teams} onAddTeam={handleAddTeam} />
            <Divider />
            <Students students={studentsByTeam[null] ?? []} onAddStudent={handleAddStudent} />
        </Stack>
    );
};

export default Event;
