/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

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

    const problemsRef = testRef.collection("private").doc("problems");
    const { data: problems } = useFirestoreDoc(problemsRef);

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
                data: { ...test.data(), id: test.id },
                problemsRef: problemsRef,
                problemsData: problems.data() ?? {},
            }}
        >
            {children}
        </TestContext.Provider>
    );
};

export default TestProvider;
