import { Alert, AlertIcon, Divider, Heading, HStack, Icon, Link, Select, Stack, Tag, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { HiUser } from "react-icons/hi";
import { useFirestoreCollectionData, useFirestoreDocData, useUser } from "reactfire";
import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";
import ParentEmailForm from "~/components/forms/ParentEmailForm";
import { useFormState } from "~/helpers/utils";

const Event = () => {
    const { ref: eventRef } = useEvent();
    const { data: user } = useUser();
    const { eventId } = useRouter().query;

    const studentRef = eventRef.collection("students").doc(user.uid);
    const { data: student } = useFirestoreDocData(studentRef, { idField: "id" });

    const teamRef = student.team ?? eventRef.collection("teams").doc("none"); // Hack for conditionals
    const teamMembersRef = eventRef.collection("students").where("team", "==", teamRef);
    const { data: teamMembers } = useFirestoreCollectionData(teamMembersRef, { idField: "id" });

    const { data: org } = useFirestoreDocData(student.org);
    const { data: team } = useFirestoreDocData(teamRef);

    // Form
    const [formState, wrapAction] = useFormState();
    const handleSubmit = wrapAction(async ({ parentEmail, birthdate, gender }) => {
        await studentRef.set({ parentEmail, birthdate, gender }, { merge: true });
    });

    const handleUpdateStudent = async update => {
        await studentRef.update(update);
    };

    return (
        <Stack spacing={6} flexBasis={600}>
            <p>
                {student.team
                    ? `Welcome to SMT! Your coach at ${org.name} has assigned you to Team ${team.name}
                           in the ${team.division == 0 ? "Tree" : "Sapling"} division. `
                    : "Welcome to SMT! Your coach has registered you for the Stanford Math Tournament, but you have yet to be assigned a team. "}
                You will complete registration and take tests on this portal.
            </p>

            <p>
                The entirety of our tournament will be run on the Discord Platform! To join our server, you will first
                need to create an account at <a href="www.discord.com">www.discord.com</a> and then you can join the
                server using this invite link:{" "}
                <Link href="https://discord.gg/JdXnUAYdVy" color="blue.500">
                    https://discord.gg/JdXnUAYdVy
                </Link>
                . And remember to use our guide as your go-to place for information about SMT 2021:{" "}
                <Link href="https://tinyurl.com/smt2021guide" color="blue.500">
                    https://tinyurl.com/smt2021guide
                </Link>
                .
            </p>

            {student.team && (
                <Card p={4} as={Stack} spacing={4}>
                    <HStack>
                        <Heading size="md">{team.name}</Heading>
                        {team.number && <Tag size="sm">{team.number}</Tag>}
                    </HStack>
                    {teamMembers.map(x => (
                        <HStack>
                            <Icon as={HiUser} boxSize={6} />
                            <Tag colorScheme={x.id === student.id ? "blue" : undefined} size="sm">
                                {x.number}
                            </Tag>
                            <Text>
                                {x.fname} {x.lname}
                            </Text>
                        </HStack>
                    ))}
                </Card>
            )}

            {student.waiverSigned && (
                <ButtonLink href={`/student/${eventId}/tests`} colorScheme="blue" size="lg">
                    Click here to take your tests
                </ButtonLink>
            )}

            <Divider />

            <Heading size="lg">Test Selection</Heading>
            <p>
                During SMT, you will have the option of selecting between either the General Test, or any two Subject
                Tests for the Individual Portion. Please select the test you would like to take below. For more
                information about the format of the competition, please refer to our website at{" "}
                <Link color="blue.500" href="http://sumo.stanford.edu/smt/">
                    http://sumo.stanford.edu/smt/
                </Link>
                .
            </p>
            <HStack spacing={4}>
                <Select
                    onChange={e => handleUpdateStudent({ test1: e.target.value })}
                    value={student.test1}
                    placeholder="Choose Test 1"
                    disabled={student.started}
                >
                    <option value="general">General Test</option>
                    <option value="geometry">Geometry Test</option>
                    <option value="algebra">Algebra Test</option>
                    <option value="combinatorics">Combinatorics Test</option>
                    <option value="nt">Number Theory Test</option>
                </Select>
                {student.test1 !== "general" && (
                    <Select
                        onChange={e => handleUpdateStudent({ test2: e.target.value })}
                        value={student.test2}
                        placeholder="Choose Test 2"
                        disabled={student.started}
                    >
                        {student.test1 !== "algebra" && <option value="algebra">Algebra Test</option>}
                        {student.test1 !== "geometry" && <option value="geometry">Geometry Test</option>}
                        {student.test1 !== "combinatorics" && <option value="combinatorics">Combinatorics Test</option>}
                        {student.test1 !== "nt" && <option value="nt">Number Theory Test</option>}
                    </Select>
                )}
            </HStack>

            <Divider />

            <Heading size="lg">Waivers</Heading>
            {student.waiverSigned ? (
                <Alert status="success">
                    <AlertIcon />
                    Your waiver has been signed.
                </Alert>
            ) : student.waiverSent ? (
                <Alert status="info">
                    <AlertIcon />A waiver form has been sent to {student.parentEmail}.
                </Alert>
            ) : (
                <>
                    {student.parentEmail && student.birthdate && student.gender ? (
                        <Alert status="info">
                            <AlertIcon />A waiver form has been requested for {student.parentEmail}. It may take up to
                            two days for the form to be sent. This page will be updated when the waiver is complete.
                        </Alert>
                    ) : (
                        <p>
                            We require waivers to be completed before you are permitted to compete at SMT 2021. Please
                            input your information by Friday, April 9th. The deadline for waivers to be completed is
                            tournament day, before any of your tests begin. The waiver will be sent directly to your
                            parent’s email for them to complete. Please allow up to two days for waivers to be sent.
                        </p>
                    )}
                    <ParentEmailForm
                        onSubmit={handleSubmit}
                        buttonText={student.parentEmail ? "Update Personal Information" : "Request Waiver"}
                        defaultValues={student}
                        {...formState}
                    />
                </>
            )}
        </Stack>
    );
};

export default Event;
