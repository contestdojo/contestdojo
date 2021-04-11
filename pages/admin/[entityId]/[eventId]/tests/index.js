import { Alert, AlertIcon } from "@chakra-ui/alert";
import { Button } from "@chakra-ui/button";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/layout";
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
} from "@chakra-ui/modal";
import firebase from "firebase";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { useFirestoreCollectionData } from "reactfire";
import { useEvent } from "~/contexts/EventProvider";
import { useFormState } from "../../../../../helpers/utils";

const ConfirmOpenTest = ({ test, onClose, onConfirm, error, isLoading }) => {
    const cancelRef = useRef();

    return (
        <AlertDialog isOpen={test !== null} onClose={onClose} motionPreset="slideInBottom">
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader>Open Test</AlertDialogHeader>
                    <AlertDialogBody>
                        <Stack spacing={4}>
                            {error && (
                                <Alert status="error">
                                    <AlertIcon /> {error.message}
                                </Alert>
                            )}
                            <Text>
                                This will open the test for all students for a window of {test?.duration / 60 + 10}{" "}
                                minutes. Confirm?
                            </Text>
                        </Stack>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={onConfirm} ml={3} isLoading={isLoading}>
                            Open Test
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

const TestsTab = () => {
    const { ref: eventRef } = useEvent();
    const testsRef = eventRef.collection("tests");
    const { data: tests } = useFirestoreCollectionData(testsRef, { idField: "id" });

    const router = useRouter();
    const { entityId, eventId } = router.query;

    const [openTest, setOpenTest] = useState(null);
    const [formState, wrapAction] = useFormState();

    const handleConfirm = wrapAction(async () => {
        const now = new Date();
        await testsRef.doc(openTest.id).update({
            openTime: firebase.firestore.Timestamp.fromDate(now),
            closeTime: firebase.firestore.Timestamp.fromDate(
                new Date(now.getTime() + (openTest.duration + 10 * 60) * 1000)
            ),
        });
        setOpenTest(null);
    });

    return (
        <Stack spacing={4}>
            {tests.map(x => (
                <HStack p={4} borderWidth={1} borderRadius="md" key={x.id}>
                    <Box flex="1">
                        <Heading size="md">{x.name}</Heading>
                        <Text>{x.problems.length} Problems</Text>
                        <Text color="gray.500">Duration: {x.duration / 60} minutes</Text>
                    </Box>
                    <NextLink href={`/admin/${entityId}/${eventId}/tests/${x.id}`} passHref>
                        <Button as="a">Edit Problems</Button>
                    </NextLink>
                    <Button colorScheme="blue" onClick={() => setOpenTest(x)}>
                        {x.openTime ? "Reopen" : "Open"} Test
                    </Button>
                </HStack>
            ))}
            <ConfirmOpenTest
                test={openTest}
                onClose={() => setOpenTest(null)}
                onConfirm={handleConfirm}
                {...formState}
            />
        </Stack>
    );
};

export default TestsTab;
