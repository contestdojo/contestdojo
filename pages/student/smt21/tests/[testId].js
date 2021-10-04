import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Button,
    Heading,
    Icon,
    Input,
    Stack,
    Text,
    VStack,
} from "@chakra-ui/react";
import TeX from "@matejmazur/react-katex";
import dayjs from "dayjs";
import firebase from "firebase";
import { useEffect, useState } from "react";
import { HiCheckCircle } from "react-icons/hi";
import MathJax from "react-mathjax-preview";
import { Sticky } from "react-sticky";
import { useFirestoreDocData, useUser } from "reactfire";
import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import AsciiMathParser from "~/helpers/asciimath2tex";
import { useFormState, useTime } from "~/helpers/utils";

const parser = new AsciiMathParser();

const Problem = ({ text, idx, submission, onUpdate }) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState("");
    const [{ isLoading, error }, wrapAction] = useFormState();

    const rendered = value && parser.parse(value);

    const handleUpdate = wrapAction(async () => {
        if (value === text) return;
        await onUpdate(value ?? "", rendered ?? "");
        setEditing(false);
    });

    useEffect(() => {
        if (!editing) {
            setValue(submission);
        }
    }, [submission]);

    return (
        <Card as={Stack} p={4} spacing={4} flex={1}>
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

            {rendered && <TeX math={rendered} />}

            {isLoading && <Text color="yellow.500">Saving...</Text>}
            {!isLoading && !error && submission && <Text color="green.500">Saved: {submission}</Text>}
            {error && <Text color="red.500">Error: {error.message}</Text>}
        </Card>
    );
};

const TestTimer = ({ time, endTime }) => {
    const timeRemaining = dayjs.duration(endTime.diff(time));
    const mins = timeRemaining.asMinutes();
    const color = mins < 1 ? "red" : mins < 5 ? "orange" : "blue";

    return (
        <Alert size="xl" colorScheme={color}>
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
    const time = useTime();

    const studentRef = eventRef.collection("students").doc(user.uid);
    const { data: student } = useFirestoreDocData(studentRef);

    const submissionId = test.team ? student.team.id : user.uid;
    const submissionRef = testRef.collection("submissions").doc(submissionId);
    const { data: submission } = useFirestoreDocData(submissionRef);
    const endTime = dayjs(submission.endTime.toDate());

    let displayProblems = problems.map((x, idx) => [x, idx]);

    if (test.type == "guts") {
        const set = submission.gutsSet ?? 0;
        displayProblems = displayProblems.slice(test.numPerSet * set, test.numPerSet * (set + 1));
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

    // Guts

    const [openDialog, closeDialog] = useDialog();
    const [dialog, setDialog] = useState(null);
    useEffect(() => {
        if (dialog !== null) {
            closeDialog(dialog);
        }
    }, [submission.gutsSet]);

    const handleNextSet = () => {
        setDialog(
            openDialog({
                type: "confirm",
                title: "Are you sure?",
                description: "Once you move onto the next set, you cannot return.",
                onConfirm: () => handleUpdate({ gutsSet: (submission.gutsSet ?? 0) + 1 }),
            })
        );
    };

    if (time.isAfter(endTime)) {
        return (
            <VStack spacing={4}>
                <VStack>
                    <Icon as={HiCheckCircle} boxSize={128} />
                    <Heading>Time's up!</Heading>
                    <Text>Your answers were submitted.</Text>
                </VStack>
                <ButtonLink href={`/student/smt21/tests`} size="sm" colorScheme="blue">
                    Back to Tests
                </ButtonLink>
            </VStack>
        );
    }

    if (displayProblems.length == 0) {
        return (
            <VStack spacing={4}>
                <VStack>
                    <Icon as={HiCheckCircle} boxSize={128} />
                    <Heading>You're done!</Heading>
                    <Text>You have completed all sets.</Text>
                </VStack>
                <ButtonLink href={`/student/smt21/tests`} size="sm" colorScheme="blue">
                    Back to Tests
                </ButtonLink>
            </VStack>
        );
    }

    return (
        <Stack direction="row" spacing={4}>
            <Stack spacing={4} flex={1}>
                <Heading size="lg">
                    {test.name}
                    {test.type == "guts" && ` (Set ${(submission.gutsSet ?? 0) + 1})`}
                </Heading>

                {displayProblems.map(([x, idx]) => (
                    <Problem
                        key={idx}
                        idx={idx}
                        text={x}
                        submission={submission?.[idx]}
                        onUpdate={(val, rendered) =>
                            handleUpdate({
                                [idx]: val || firebase.firestore.FieldValue.delete(),
                                [`${idx}r`]: rendered || firebase.firestore.FieldValue.delete(),
                                [`${idx}t`]: firebase.firestore.FieldValue.serverTimestamp(),
                            })
                        }
                    />
                ))}

                {test.type == "guts" && (
                    <Button colorScheme="blue" onClick={handleNextSet} alignSelf="flex-start">
                        Next Set
                    </Button>
                )}
            </Stack>
            <Stack flexBasis={300} flexShrink={0} spacing={4} style={{ marginTop: "-1rem" }}>
                <Sticky relative>
                    {({ style }) => (
                        <Stack spacing={4} mt={4} {...style}>
                            <TestTimer time={time} endTime={endTime} />
                            <Card as={Stack} spacing={4} p={4}>
                                <Heading size="md">Clarifications</Heading>
                                <MathJax math={test.clarifications ?? "None at this time."} />
                            </Card>
                        </Stack>
                    )}
                </Sticky>
            </Stack>
        </Stack>
    );
};

const Test = () => (
    <TestProvider>
        <TestContent />
    </TestProvider>
);

Test.layoutProps = { flex: 1 };

export default Test;
