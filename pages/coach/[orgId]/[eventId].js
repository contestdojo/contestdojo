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
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { useFirestore, useFirestoreCollectionData, useFunctions } from "reactfire";
import AddStudentModal from "~/components/AddStudentModal";
import AddTeamModal from "~/components/AddTeamModal";
import { useDialog } from "~/components/DialogProvider";
import { delay, useEventData, useOrgData } from "~/helpers/utils";

const BlankCard = () => {
    return (
        <Flex
            m={2}
            p={4}
            borderWidth={1}
            flex={1}
            justifyContent="center"
            alignItems="center"
            borderStyle="dashed"
            borderRadius="md"
        >
            <Text as="h4" size="md" color="gray.500">
                Drag students here
            </Text>
        </Flex>
    );
};
const StudentCard = ({ id, fname, lname, email }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          }
        : undefined;

    return (
        <Box
            m={2}
            p={4}
            borderWidth={1}
            borderRadius="md"
            backgroundColor="white"
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
        >
            <Heading as="h4" size="md">
                {fname} {lname}
            </Heading>
            <Text>{email}</Text>
        </Box>
    );
};

const TeamCard = ({ id, name, students }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const props = {
        backgroundColor: isOver ? "gray.100" : undefined,
    };
    return (
        <Stack
            spacing={0}
            flex={1}
            p={2}
            borderWidth={1}
            borderRadius="md"
            minHeight="xs"
            transition="background-color 0.1s"
            {...props}
        >
            <Heading p={2} as="h4" size="md">
                {name}
            </Heading>
            <Flex direction="column" flex={1} ref={setNodeRef}>
                {students.map(x => (
                    <StudentCard key={x.id} {...x} />
                ))}
                {students.length === 0 && <BlankCard />}
            </Flex>
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

    // Unassigned droppable
    const { isOver, setNodeRef } = useDroppable({ id: "unassigned" });
    const props = {
        backgroundColor: isOver ? "gray.100" : undefined,
    };

    return (
        <>
            <Heading size="lg">Unassigned Students</Heading>

            <Wrap
                spacing={0}
                style={{ marginLeft: "-0.5rem", marginRight: "-0.5rem" }}
                transition="background-color 0.1s"
                borderRadius={4}
                ref={setNodeRef}
                {...props}
            >
                {students.map(x => (
                    <WrapItem key={x.id}>
                        <StudentCard {...x} width={300} />
                    </WrapItem>
                ))}
                {students.length === 0 && <BlankCard />}
            </Wrap>

            <Button colorScheme="blue" alignSelf="flex-start" onClick={onOpen}>
                Invite Student
            </Button>
            <AddStudentModal isOpen={isOpen} onClose={onClose} onSubmit={handleAddStudent} {...formState} />
        </>
    );
};

const Event = () => {
    // Functions
    const firestore = useFirestore();
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

        await studentRef.set({
            fname,
            lname,
            email,
            user: firestore.collection("users").doc(uid),
            org: orgRef,
        });

        if (!existed) {
            openDialog(
                "Student Invited",
                "Created a new student account. An email has been sent to the student containing login details."
            );
        }
    };

    const handleDragEnd = ({ active, over }) => {
        if (!over) return;
        studentsRef.doc(active.id).update({
            team: over.id === "unassigned" ? null : teamsRef.doc(over.id),
        });
    };

    return (
        <DndContext onDragEnd={handleDragEnd}>
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
        </DndContext>
    );
};

export default Event;
