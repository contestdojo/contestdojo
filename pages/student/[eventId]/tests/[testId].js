import { Alert, AlertDescription, AlertIcon, AlertTitle, Heading, Input, Stack, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import firebase from "firebase";
import { useEffect, useState } from "react";
import MathJax from "react-mathjax-preview";
import { useFirestoreDocData, useUser } from "reactfire";
import TestProvider, { useTest } from "~/contexts/TestProvider";
import { useFormState, useTime } from "../../../../helpers/utils";

const Problem = ({ text, idx, submission, onUpdate }) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState("");
    const [{ isLoading, error }, wrapAction] = useFormState();

    const handleUpdate = wrapAction(async () => {
        await onUpdate(value);
        setEditing(false);
    });

    useEffect(() => {
        if (!editing) {
            setValue(submission);
        }
    }, [submission]);

    return (
        <Stack p={4} spacing={4} borderRadius="md" borderWidth={1} flex={1}>
            <Heading size="md">Problem {idx + 1}</Heading>
            <MathJax math={text} config={{ menuSettings: { inTabOrder: false } }} />

            <Input
                value={value}
                onChange={e => {
                    setValue(e.target.value);
                    setEditing(true);
                }}
                onBlur={handleUpdate}
                placeholder="0"
            />

            {value && <MathJax math={"`" + value + "`"} />}

            {isLoading && <Text color="yellow.500">Saving...</Text>}
            {!isLoading && !error && submission && <Text color="green.500">Saved: {submission}</Text>}
            {error && <Text color="red.500">Error: {error.message}</Text>}
        </Stack>
    );
};

const TestTimer = ({ endTime }) => {
    const time = useTime();
    const endT = dayjs(endTime.toDate());
    const timeRemaining = dayjs.duration(endT.diff(time));
    return (
        <Alert size="xl">
            <AlertIcon />
            <AlertTitle>Time Remaining</AlertTitle>
            <AlertDescription>{timeRemaining.format("HH:mm:ss")}</AlertDescription>
        </Alert>
    );
};

const TestContent = () => {
    const {
        ref: testRef,
        data: test,
        problemsData: { problems = [] },
    } = useTest();

    const { data: user } = useUser();
    const submissionsRef = testRef.collection("submissions").doc(user.uid);
    const { data: submissions } = useFirestoreDocData(submissionsRef);

    if (!submissions.startTime) {
        return (
            <Alert status="error">
                <AlertIcon />
                Submission Not Found
            </Alert>
        );
    }

    const handleUpdate = async update => {
        await submissionsRef.update(update);
    };

    return (
        <Stack spacing={4}>
            <Heading size="lg">{test.name}</Heading>
            <TestTimer endTime={submissions.endTime} />
            {problems.map((x, idx) => (
                <Problem
                    key={idx}
                    idx={idx}
                    text={x}
                    submission={submissions?.[idx]}
                    onUpdate={val =>
                        handleUpdate({ [idx]: (val ?? "") === "" ? firebase.firestore.FieldValue.delete() : val })
                    }
                />
            ))}
        </Stack>
    );
};

const Test = () => (
    <TestProvider>
        <TestContent />
    </TestProvider>
);

Test.layoutProps = { flexBasis: 800 };

export default Test;
