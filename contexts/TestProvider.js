import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { createContext, useContext } from "react";
import { useFirestoreDoc } from "reactfire";
import { useEvent } from "./EventProvider";

export const TestContext = createContext();
export const useTest = () => useContext(TestContext);

const TestProvider = ({ children }) => {
    const router = useRouter();
    const { ref: eventRef } = useEvent();

    const { testId } = router.query;
    const testRef = eventRef.collection("tests").doc(testId);
    const { data: test } = useFirestoreDoc(testRef);

    if (!test.exists) {
        return (
            <Alert status="error">
                <AlertIcon />
                <Box>
                    <AlertTitle>Test Not Found</AlertTitle>
                    <AlertDescription>The test you are trying to access was not found.</AlertDescription>
                </Box>
            </Alert>
        );
    }

    return (
        <TestContext.Provider
            value={{
                ref: testRef,
                data: test.data(),
            }}
        >
            {children}
        </TestContext.Provider>
    );
};

export default TestProvider;
