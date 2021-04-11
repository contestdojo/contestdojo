import { Alert, AlertIcon } from "@chakra-ui/alert";
import { Button } from "@chakra-ui/button";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/layout";
import firebase from "firebase";
import { useRouter } from "next/router";
import { useFirestoreCollectionData, useFirestoreDocData, useFunctions, useUser } from "reactfire";
import { useEvent } from "~/contexts/EventProvider";
import { useFormState } from "../../../../helpers/utils";

const Tests = () => {
    const { data: user } = useUser();
    const { ref: eventRef } = useEvent();

    const studentRef = eventRef.collection("students").doc(user.uid);
    const { data: student } = useFirestoreDocData(studentRef);

    const eligibleTests = student.test1 == "general" ? ["general"] : [student.test1, student.test2];

    const testsRef = eventRef.collection("tests").where(firebase.firestore.FieldPath.documentId(), "in", eligibleTests);
    const { data: tests } = useFirestoreCollectionData(testsRef, { idField: "id" });

    const router = useRouter();
    const { eventId } = router.query;

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
            <Text>The following tests are available for you to take:</Text>

            {tests.map(x => (
                <HStack p={4} borderWidth={1} borderRadius="md" maxW="xl" key={x.id}>
                    <Box flex="1">
                        <Heading size="md">{x.name}</Heading>
                        <Text color="gray.500">Duration: {x.duration / 60} minutes</Text>
                    </Box>
                    <Button colorScheme="blue" onClick={() => handleStartTest(x.id)} isLoading={isLoading === x.id}>
                        Start
                    </Button>
                </HStack>
            ))}
        </Stack>
    );
};

export default Tests;
