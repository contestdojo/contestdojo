import {
    Box,
    Button,
    Divider,
    Editable,
    EditableInput,
    Flex,
    Heading,
    HStack,
    Link,
    Select,
    Stack,
    Text,
    Tooltip,
    useDisclosure,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { useRouter } from "next/router";
import { useFirestore, useFirestoreCollectionData, useFirestoreDocData, useFunctions } from "reactfire";
import AddStudentModal from "~/components/AddStudentModal";
import AddTeamModal from "~/components/AddTeamModal";
import StyledEditablePreview from "~/components/StyledEditablePreview";
import { useDialog } from "~/contexts/DialogProvider";
import EventProvider, { useEvent } from "~/contexts/EventProvider";
import OrgProvider, { useOrg } from "~/contexts/OrgProvider";
import { useFormState } from "../../../../helpers/utils";

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

const StudentCard = ({ id, fname, lname, email, test1, test2, waiverSigned, onUpdate }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          }
        : undefined;

    return (
        <Stack
            spacing={2}
            m={2}
            p={4}
            borderWidth={1}
            borderRadius="md"
            backgroundColor="white"
            ref={setNodeRef}
            style={style}
        >
            <Box {...listeners} {...attributes}>
                <Heading as="h4" size="md">
                    {fname} {lname}
                </Heading>
                <Text>{email}</Text>
                <Text color={waiverSigned ? "gray.500" : "red.500"}>Waiver {!waiverSigned && "Not "} Signed</Text>
            </Box>
            <HStack spacing={4}>
                <Select onChange={e => onUpdate({ test1: e.target.value })} value={test1} placeholder="Choose Test 1">
                    <option value="general">General Test</option>
                    <option value="geometry">Geometry Test</option>
                    <option value="algebra">Algebra Test</option>
                    <option value="combinatorics">Combinatorics Test</option>
                    <option value="nt">Number Theory Test</option>
                </Select>
                {test1 !== "general" && (
                    <Select
                        onChange={e => onUpdate({ test2: e.target.value })}
                        value={test2}
                        placeholder="Choose Test 2"
                    >
                        {test1 !== "algebra" && <option value="algebra">Algebra Test</option>}
                        {test1 !== "geometry" && <option value="geometry">Geometry Test</option>}
                        {test1 !== "combinatorics" && <option value="combinatorics">Combinatorics Test</option>}
                        {test1 !== "nt" && <option value="nt">Number Theory Test</option>}
                    </Select>
                )}
            </HStack>
        </Stack>
    );
};

const TeamCard = ({ id, name, students, onUpdate, onUpdateStudent }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const props = {
        backgroundColor: isOver ? "gray.100" : undefined,
    };
    return (
        <Stack
            maxWidth={600}
            spacing={0}
            flex={1}
            p={2}
            borderWidth={1}
            borderRadius="md"
            minHeight="xs"
            transition="background-color 0.1s"
            {...props}
        >
            <Heading p={2} as="h4" size="md" position="relative">
                <Editable defaultValue={name} onSubmit={name => onUpdate({ name })}>
                    <StyledEditablePreview />
                    <EditableInput />
                </Editable>
            </Heading>
            <Flex direction="column" flex={1} ref={setNodeRef}>
                {students.map(x => (
                    <StudentCard key={x.id} {...x} onUpdate={update => onUpdateStudent(x.id, update)} />
                ))}
                {students.length === 0 && <BlankCard />}
            </Flex>
        </Stack>
    );
};

const Teams = ({ title, maxTeams, teams, onAddTeam, onUpdateTeam, onUpdateStudent, studentsByTeam }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [formState, wrapAction] = useFormState();

    const handleAddTeam = wrapAction(async values => {
        await onAddTeam(values);
        onClose();
    });

    return (
        <Stack spacing={4}>
            <Heading size="lg">{title ?? "Teams"}</Heading>
            <p>You may sign up for up to {maxTeams ?? 0} teams.</p>
            {teams.length > 0 && (
                <Stack direction="row" spacing={4}>
                    {teams.map(x => (
                        <TeamCard
                            key={x.id}
                            onUpdate={update => onUpdateTeam(x.id, update)}
                            onUpdateStudent={onUpdateStudent}
                            {...x}
                            students={studentsByTeam[x.id] ?? []}
                        />
                    ))}
                </Stack>
            )}
            {teams.length < (maxTeams ?? 0) ? (
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
        </Stack>
    );
};

const Students = ({ students, onAddStudent }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [formState, wrapAction] = useFormState();

    const handleAddStudent = wrapAction(async values => {
        await onAddStudent(values);
        onClose();
    });

    // Unassigned droppable
    const { isOver, setNodeRef } = useDroppable({ id: "unassigned" });
    const props = {
        backgroundColor: isOver ? "gray.100" : undefined,
    };

    return (
        <Stack spacing={4}>
            <Heading size="lg">Unassigned Students</Heading>
            <p>
                Once you add a student to your team, they will receive an email invitation to create an account on our
                website. Upon creation of their account, students will be prompted to add their parent’s email address.
                Required waivers will be sent directly to parents. Please add students to your teams and have them input
                their information by Friday, April 9th. The deadline for waivers to be completed is tournament day,
                before students take any tests. Students will not be permitted to compete if they do not have a
                completed waiver by competition day.
            </p>
            <p>
                Students are required to be (i) high school students, (ii) aged 14 years or older, and (iii) currently
                in the United States.{" "}
                <b>By adding a student to my team, I certify that they satisfy these requirements.</b>
            </p>
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
        </Stack>
    );
};

const TeamsContent = () => {
    const router = useRouter();

    // Functions
    const firestore = useFirestore();
    const functions = useFunctions();
    const createStudentAccount = functions.httpsCallable("createStudentAccount");

    // Data
    const { ref: orgRef, data: org } = useOrg();
    const { ref: eventRef, data: event } = useEvent();

    // Get students
    const eventOrgRef = eventRef.collection("orgs").doc(orgRef.id);
    const { data: eventOrg } = useFirestoreDocData(eventOrgRef);

    if ((eventOrg.stage ?? event.defaultStage) != "teams") {
        router.replace(`/coach/${orgRef.id}/${eventRef.id}`);
    }

    // Get teams
    const teamsRef = eventRef.collection("teams");
    const { data: teams } = useFirestoreCollectionData(teamsRef.where("org", "==", orgRef), { idField: "id" });

    const treeTeams = teams.filter(x => x.division == 0);
    const saplingTeams = teams.filter(x => x.division == 1);

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

    const handleAddTreeTeam = async ({ name }) => {
        await teamsRef.add({ name: name, org: orgRef, division: 0 });
    };

    const handleAddSaplingTeam = async ({ name }) => {
        await teamsRef.add({ name: name, org: orgRef, division: 1 });
    };

    const handleUpdateTeam = async (id, update) => {
        await teamsRef.doc(id).update(update);
    };

    const handleUpdateStudent = async (id, update) => {
        await studentsRef.doc(id).update(update);
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

    if (eventOrg.maxTeams + eventOrg.maxTeamsSapling == 0) {
        return (
            <Stack spacing={6} flex={1}>
                <HStack alignItems="flex-end" spacing={6}>
                    <Heading size="2xl">{event.name}</Heading>
                    <Heading size="lg">{org.name}</Heading>
                </HStack>
                <Divider />
                <p>
                    Unfortunately, your application for the tournament was not accepted. If you have any questions, feel
                    free to email the SMT team at stanford.math.tournament@gmail.com.
                </p>
            </Stack>
        );
    }

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <Stack spacing={6} flex={1}>
                <HStack alignItems="flex-end" spacing={6}>
                    <Heading size="2xl">{event.name}</Heading>
                    <Heading size="lg">{org.name}</Heading>
                </HStack>
                <Divider />
                <Stack spacing={4}>
                    <p>
                        Your organization may register up to {eventOrg.maxTeams} teams in the Tree division and{" "}
                        {eventOrg.maxTeamsSapling} teams in the Sapling division. You may now create teams and add
                        students to teams.
                    </p>
                    <p>
                        The Tree division is for teams that will participate in all rounds of the competition: Power,
                        Team, Guts, and Individual subject tests. The Sapling divisions is for teams that will
                        participate in all rounds except Power: Team, Guts, and Individual.
                    </p>
                    <p>
                        To confirm your organization’s participation, please register at this Eventbrite:{" "}
                        <Link color="blue.500" href="https://tinyurl.com/smt-tickets">
                            https://tinyurl.com/smt-tickets
                        </Link>
                        . The cost for participation at SMT is $10 per individual for both divisions. The payment
                        deadline is Friday, April 9th. Coaches must pay for all individuals in their organization.
                        Please purchase the tickets with the email that you used for registration. When you purchase
                        tickets, you will be asked to list the attendees. It is okay if the attendees listed on your
                        registration do not match the final list of students participating.
                    </p>
                    <p>
                        You have currently paid for {eventOrg.paidStudents ?? 0} individuals. Please allow up to one
                        week for payment to reflect on this dashboard.
                    </p>
                    <p>
                        For more information about SMT 2021, please visit our website:{" "}
                        <Link color="blue.500" href="http://sumo.stanford.edu/smt/">
                            http://sumo.stanford.edu/smt/
                        </Link>
                        . If you have any questions, feel free to email the SMT team at
                        stanford.math.tournament@gmail.com.
                    </p>
                </Stack>
                <Divider />
                {eventOrg.maxTeams > 0 && (
                    <>
                        <Teams
                            title="Tree Division"
                            event={event}
                            teams={treeTeams}
                            maxTeams={eventOrg.maxTeams}
                            studentsByTeam={studentsByTeam}
                            onAddTeam={handleAddTreeTeam}
                            onUpdateTeam={handleUpdateTeam}
                            onUpdateStudent={handleUpdateStudent}
                        />
                        <Divider />
                    </>
                )}
                {eventOrg.maxTeamsSapling > 0 && (
                    <>
                        <Teams
                            title="Sapling Division"
                            event={event}
                            teams={saplingTeams}
                            maxTeams={eventOrg.maxTeamsSapling}
                            studentsByTeam={studentsByTeam}
                            onAddTeam={handleAddSaplingTeam}
                            onUpdateTeam={handleUpdateTeam}
                            onUpdateStudent={handleUpdateStudent}
                        />
                        <Divider />
                    </>
                )}
                <Students students={studentsByTeam[null] ?? []} onAddStudent={handleAddStudent} />
            </Stack>
        </DndContext>
    );
};

const TeamsPage = () => (
    <OrgProvider>
        <EventProvider>
            <TeamsContent />
        </EventProvider>
    </OrgProvider>
);

export default TeamsPage;
