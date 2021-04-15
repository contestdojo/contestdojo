import { Divider, Heading, Stack } from "@chakra-ui/react";
import { useFirestoreCollectionData } from "reactfire";
import TestProvider, { useTest } from "~/contexts/TestProvider";

const Submissions = () => {
    const {
        ref: testRef,
        data: test,
        problemsData: { problems = [] },
    } = useTest();

    const submissionsRef = testRef.collection("submissions");
    const { data: submissions } = useFirestoreCollectionData(submissionsRef);

    const gradedRef = testRef.collection("graded");
    const { data: graded } = useFirestoreCollectionData(gradedRef);

    return (
        <Stack spacing={4}>
            <Heading size="lg">{test.name}</Heading>
        </Stack>
    );
};

const SubmissionsTab = () => (
    <TestProvider>
        <Submissions />
    </TestProvider>
);

export default SubmissionsTab;
