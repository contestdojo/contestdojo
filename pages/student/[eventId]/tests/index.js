import NextLink from "next/link";
import { Alert, AlertIcon } from "@chakra-ui/alert";
import { Button } from "@chakra-ui/button";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/layout";
import firebase from "firebase";
import { useRouter } from "next/router";
import { useFirestoreCollectionData, useFirestoreDocData, useFunctions, useUser } from "reactfire";
import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";
import { useFormState, useTime } from "~/helpers/utils";
import ButtonLink from "~/components/ButtonLink";

const Tests = () => {
    const { data: user } = useUser();
    const { ref: eventRef, data: event } = useEvent();
    const time = useTime();
    const router = useRouter();
    const { eventId } = router.query;

    const studentRef = eventRef.collection("students").doc(user.uid);
    const { data: student } = useFirestoreDocData(studentRef);

    const eligibleTests = student.test1 == "general" ? ["general"] : [student.test1 ?? "", student.test2 ?? ""];
    eligibleTests.push("team");
    eligibleTests.push("guts");
    eligibleTests.push("testround");

    const testsRef = eventRef.collection("tests").where(
        firebase.firestore.FieldPath.documentId(),
        "in",
        eligibleTests.filter(x => !!x)
    );

    const { data: tests } = useFirestoreCollectionData(testsRef, { idField: "id" });
    const displayTests = tests.filter(
        x => x.openTime && x.openTime.toDate() < time.toDate() && time.toDate() < x.closeTime.toDate()
    );

    const functions = useFunctions();
    const startTest = functions.httpsCallable("startTest");

    const [{ isLoading, error }, wrapAction] = useFormState({ multiple: true });

    const handleStartTest = wrapAction(async testId => {
        await startTest({ eventId, testId });
        router.push(`/student/${eventId}/tests/${testId}`);
    });

    return (
        <Stack spacing={4} flexBasis={600}>
            {error && (
                <Alert status="error">
                    <AlertIcon />
                    {error.message}
                </Alert>
            )}

            {student.waiverSigned ? (
                <>
                    <Text>
                        {displayTests.length === 0
                            ? "You do not have any available tests at the moment."
                            : "The following tests are available for you to take:"}
                    </Text>

                    {displayTests.map(x => (
                        <Card as={HStack} p={4} maxW="xl" key={x.id}>
                            <Box flex="1">
                                <Heading size="md">{x.name}</Heading>
                                <Text color="gray.500">Duration: {x.duration / 60} minutes</Text>
                            </Box>
                            <Button
                                colorScheme="blue"
                                onClick={() => handleStartTest(x.id)}
                                isLoading={isLoading === x.id}
                                disabled={!open}
                            >
                                {open ? "Start" : "Not Open"}
                            </Button>
                        </Card>
                    ))}
                </>
            ) : (
                <Alert status="error">
                    <AlertIcon />
                    You must complete your waiver before taking tests.
                </Alert>
            )}

            <ButtonLink href={`/student/${eventId}`} colorScheme="blue" alignSelf="flex-start">
                Back to {event.name}
            </ButtonLink>
        </Stack>
    );
};

export default Tests;
