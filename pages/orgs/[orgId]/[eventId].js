import {
    Box,
    Button,
    Divider,
    Flex,
    Heading,
    HStack,
    Stack,
    Text,
    Tooltip,
    useDisclosure,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useFirestore, useFirestoreCollectionData, useFunctions } from "reactfire";
import AddStudentModal from "~/components/AddStudentModal";
import AddTeamModal from "~/components/AddTeamModal";
import { useDialog } from "~/components/DialogProvider";
import { delay, useEventData, useOrgData } from "~/helpers/utils";

const StudentCard = ({ id, idx, fname, lname, email, ...props }) => {
    return (
        <Draggable draggableId={id} index={idx}>
            {provided => (
                <Box
                    m={2}
                    p={4}
                    borderWidth={1}
                    borderRadius="md"
                    backgroundColor="white"
                    transition="width 0.2s"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    {...props}
                >
                    <Heading as="h4" size="md">
                        {fname} {lname}
                    </Heading>
                    <Text>{email}</Text>
                </Box>
            )}
        </Draggable>
    );
};

const TeamCard = ({ id, name, students }) => {
    return (
        <Stack spacing={0} flex={1} p={2} borderWidth={1} borderRadius="md" minHeight="xs">
            <Heading p={2} as="h4" size="md">
                {name}
            </Heading>
            <Droppable droppableId={id}>
                {provided => (
                    <Flex direction="column" flex={1} ref={provided.innerRef} {...provided.droppableProps}>
                        {students.map((x, idx) => (
                            <StudentCard key={x.id} idx={idx} {...x} />
                        ))}
                        {provided.placeholder}
                    </Flex>
                )}
            </Droppable>
        </Stack>
    );
};

const Teams = ({ event, teams, onAddTeam, studentsByTeam }) => {
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
                <Stack direction="row" spacing={4}>
                    {teams.map(x => (
                        <TeamCard key={x.id} {...x} students={studentsByTeam[x.id] ?? []} />
                    ))}
                </Stack>
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
            <Droppable droppableId="unassigned" direction="horizontal">
                {provided => (
                    <Wrap
                        style={{ marginLeft: "-0.5rem", marginRight: "-0.5rem" }}
                        spacing={0}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {students.map((x, idx) => (
                            <WrapItem>
                                <StudentCard key={x.id} idx={idx} {...x} width={300} />
                            </WrapItem>
                        ))}
                        {provided.placeholder}
                    </Wrap>
                )}
            </Droppable>
            <Button colorScheme="blue" alignSelf="flex-start" onClick={onOpen}>
                Invite Student
            </Button>
            <AddStudentModal isOpen={isOpen} onClose={onClose} onSubmit={handleAddStudent} {...formState} />
        </>
    );
};

const Event = () => {
    // Functions
    const functions = useFunctions();
    const createStudentAccount = functions.httpsCallable("createStudentAccount");

    // Data
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

    // Dialog
    const [openDialog] = useDialog();

    const handleAddTeam = async ({ name }) => {
        await teamsRef.add({ name: name, org: orgRef });
    };

    const handleAddStudent = async values => {
        const { data } = await createStudentAccount(values);
        const { existed, uid, fname, lname, email } = data;

        const studentRef = studentsRef.doc(uid);
        const snap = await studentRef.get();
        if (snap.exists) throw new Error("This student is already associated with an organization.");

        await studentRef.set({ fname, lname, email, org: orgRef });

        if (!existed) {
            openDialog(
                "Student Invited",
                "Created a new student account. An email has been sent to the student containing login details."
            );
        }
    };

    const handleDragEnd = ({ source, destination, draggableId }) => {
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        studentsRef.doc(draggableId).update({
            team: destination.droppableId === "unassigned" ? null : teamsRef.doc(destination.droppableId),
        });
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Stack spacing={6} flex={1}>
                <HStack alignItems="flex-end" spacing={6}>
                    <Heading size="2xl">{event.name}</Heading>
                    <Heading size="lg">{org.name}</Heading>
                </HStack>
                <Divider />
                <Teams event={event} teams={teams} studentsByTeam={studentsByTeam} onAddTeam={handleAddTeam} />
                <Divider />
                <Students students={studentsByTeam[null] ?? []} onAddStudent={handleAddStudent} />
            </Stack>
        </DragDropContext>
    );
};

export default Event;
