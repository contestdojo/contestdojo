import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, Heading, Input, Stack, Text } from "@chakra-ui/react";
import asciimath from "ascii-math";
import dayjs from "dayjs";
import firebase from "firebase";
import { useEffect, useState } from "react";
import MathJax from "react-mathjax-preview";
import { useFirestoreDocData, useUser } from "reactfire";
import { useEvent } from "~/contexts/EventProvider";
import TestProvider, { useTest } from "~/contexts/TestProvider";
import { useFormState, useTime } from "~/helpers/utils";

const Problem = ({ text, idx, submission, onUpdate }) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState("");
    const [{ isLoading, error }, wrapAction] = useFormState();

    const rendered = value && asciimath(value).toString();

    const handleUpdate = wrapAction(async () => {
        await onUpdate(value ?? "", rendered ?? "");
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
                value={value ?? ""}
                onChange={e => {
                    setValue(e.target.value);
                    setEditing(true);
                }}
                onBlur={handleUpdate}
                placeholder="0"
            />

            {rendered && <MathJax math={rendered} />}

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

    const { ref: eventRef } = useEvent();
    const { data: user } = useUser();

    const studentRef = eventRef.collection("students").doc(user.uid);
    const { data: student } = useFirestoreDocData(studentRef);

    const submissionId = test.team ? student.team.id : user.uid;
    const submissionRef = testRef.collection("submissions").doc(submissionId);
    const { data: submission } = useFirestoreDocData(submissionRef);

    let displayProblems = problems;

    if (test.type == "guts") {
        const set = submission.gutsSet ?? 0;
        displayProblems = problems.slice(test.numPerSet * set, test.numPerSet * (set + 1));
    }

    if (!submission.startTime) {
        return (
            <Alert status="error">
                <AlertIcon />
                Submission Not Found
            </Alert>
        );
    }

    const handleUpdate = async update => {
        await submissionRef.update(update);
    };

    if (displayProblems.length == 0) {
        return (
            <Stack spacing={4}>
                <Heading size="lg">
                    {test.name}
                    {test.type == "guts" && ` (Set ${submission.gutsSet ?? 0 + 1})`}
                </Heading>
                <Text>You are done !!</Text>
            </Stack>
        );
    }

    return (
        <Stack spacing={4}>
            <Heading size="lg">
                {test.name}
                {test.type == "guts" && ` (Set ${submission.gutsSet ?? 0 + 1})`}
            </Heading>
            <TestTimer endTime={submission.endTime} />

            {displayProblems.map((x, idx) => (
                <Problem
                    key={idx}
                    idx={idx + test.numPerSet * (submission.gutsSet ?? 0)}
                    text={x}
                    submission={submission?.[idx]}
                    onUpdate={(val, rendered) =>
                        handleUpdate({
                            [idx]: val || firebase.firestore.FieldValue.delete(),
                            [`${idx}r`]: rendered || firebase.firestore.FieldValue.delete(),
                        })
                    }
                />
            ))}

            {test.type == "guts" && (
                <Button
                    colorScheme="blue"
                    onClick={() => handleUpdate({ gutsSet: (submission.gutsSet ?? 0) + 1 })}
                    alignSelf="flex-start"
                >
                    Next Set
                </Button>
            )}
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
