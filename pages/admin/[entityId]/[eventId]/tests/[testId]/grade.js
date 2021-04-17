import { Box, Button, Divider, Heading, HStack, IconButton, Stack, Wrap, WrapItem } from "@chakra-ui/react";
import TeX from "@matejmazur/react-katex";
import firebase from "firebase";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { HiCheck, HiX } from "react-icons/hi";
import MathJax from "react-mathjax-preview";
import { useFirestoreCollectionData, useFirestoreDocData, useFunctions } from "reactfire";
import BlankCard from "~/components/BlankCard";
import Card from "~/components/Card";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";

const Answer = ({ text, correct, onUpdate }) => {
    return (
        <WrapItem as={Card} flex={1} maxW="md" flexBasis={200}>
            <Box p={4} flex="1">
                {text.startsWith("<math>") ? <MathJax math={text} /> : <TeX math={text} block />}
            </Box>
            <Stack spacing={0}>
                <IconButton
                    colorScheme={correct === true ? "green" : undefined}
                    icon={<HiCheck />}
                    onClick={() => onUpdate(true)}
                    borderLeftRadius={0}
                    borderBottomRightRadius={0}
                />
                <IconButton
                    colorScheme={correct === false ? "red" : undefined}
                    icon={<HiX />}
                    onClick={() => onUpdate(false)}
                    borderLeftRadius={0}
                    borderTopRightRadius={0}
                />
            </Stack>
        </WrapItem>
    );
};

const Problem = ({ text, idx, answers, correct, onUpdate }) => {
    const { eventId, testId } = useRouter().query;
    const [state, setState] = useState(text);
    const [isLoading, setIsLoading] = useState(false);

    const functions = useFunctions();
    const gradeTests = functions.httpsCallable("gradeTests");

    useEffect(() => {
        setState(text);
    }, [text]);

    const handleRegrade = async () => {
        setIsLoading(true);
        await gradeTests({ eventId, testId, problemIdx: idx });
        setIsLoading(false);
    };

    return (
        <Stack spacing={4} flex="1">
            <Card as={Stack} p={4} spacing={4}>
                <Heading size="md">Problem {idx + 1}</Heading>
                <MathJax math={state} />
            </Card>
            <Divider />
            <HStack>
                <Heading size="md" flex="1">
                    Answers
                </Heading>
                <Button onClick={handleRegrade} isLoading={isLoading}>
                    Re-grade Tests
                </Button>
            </HStack>
            <Wrap>
                {answers.map(x => (
                    <Answer key={x} text={x} correct={correct[x]} onUpdate={status => onUpdate(x, status)} />
                ))}
                {answers.length === 0 && <BlankCard>Answers will appear here</BlankCard>}
            </Wrap>
        </Stack>
    );
};

const Navigation = ({ selected, total, onSelect }) => (
    <Stack flexBasis={150}>
        {[...Array(total).keys()].map(idx => (
            <Button key={idx} onClick={() => onSelect(idx)} colorScheme={selected == idx ? "blue" : undefined}>
                Problem {idx + 1}
            </Button>
        ))}
    </Stack>
);

const Test = () => {
    const {
        ref: testRef,
        data: test,
        problemsData: { problems = [] },
    } = useTest();

    const submissionsRef = testRef.collection("submissions");
    const { data: submissions } = useFirestoreCollectionData(submissionsRef);

    const answersRef = testRef.collection("private").doc("answers");
    const { data: answers } = useFirestoreDocData(answersRef);

    const [index, setIndex] = useState(0);

    const handleUpdate = async (ans, status) => {
        if (Object.keys(answers).length === 1) {
            await answersRef.set({}, { merge: true });
        }
        const path = new firebase.firestore.FieldPath(index.toString(), ans);
        await answersRef.update(path, status);
    };

    return (
        <Stack spacing={4}>
            <Heading size="lg">{test.name}</Heading>
            <Stack direction="row" spacing={4} flex="1">
                <Navigation selected={index} total={problems.length} onSelect={setIndex} />
                <Divider orientation="vertical" />
                <Problem
                    text={problems[index]}
                    idx={index}
                    answers={[...new Set(submissions.map(x => x[`${index}r`]).filter(x => x !== undefined))]}
                    correct={answers[index] ?? {}}
                    onUpdate={handleUpdate}
                />
            </Stack>
        </Stack>
    );
};

const TestTab = () => (
    <TestProvider>
        <Test />
    </TestProvider>
);

export default TestTab;
