import { Button } from "@chakra-ui/button";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/layout";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useFirestoreCollectionData } from "reactfire";
import { useEvent } from "~/contexts/EventProvider";

const TestsTab = () => {
    const { ref: eventRef } = useEvent();
    const testsRef = eventRef.collection("tests");
    const { data: tests } = useFirestoreCollectionData(testsRef, { idField: "id" });

    const router = useRouter();
    const { entityId, eventId } = router.query;

    return (
        <Stack spacing={4}>
            {tests.map(x => (
                <HStack p={4} borderWidth={1} borderRadius="md" maxW="xl" key={x.id}>
                    <Box flex="1">
                        <Heading size="md">{x.name}</Heading>
                        <Text>{x.problems.length} Problems</Text>
                        <Text color="gray.500">Duration: {x.duration / 60} minutes</Text>
                    </Box>
                    <NextLink href={`/admin/${entityId}/${eventId}/tests/${x.id}`} passHref>
                        <Button as="a" colorScheme="blue">
                            Edit
                        </Button>
                    </NextLink>
                </HStack>
            ))}
        </Stack>
    );
};

export default TestsTab;
