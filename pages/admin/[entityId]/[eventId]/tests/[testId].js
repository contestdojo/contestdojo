import { Box, Button, Heading, Stack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import MathJax from "react-mathjax-preview";
import ResizingTextarea from "~/components/ResizingTextarea";
import TestProvider, { useTest } from "~/contexts/TestProvider";

const Problem = ({ text, idx, onUpdate }) => {
    const [state, setState] = useState(text);

    useEffect(() => {
        setState(text);
    }, [text]);

    return (
        <Stack spacing={4} direction="row">
            <Stack p={4} spacing={4} borderRadius="md" borderWidth={1} flex={1}>
                <Heading size="md">Problem {idx + 1}</Heading>
                <Box flex={1}>
                    <ResizingTextarea
                        value={state}
                        onChange={e => setState(e.target.value)}
                        onBlur={() => onUpdate(state)}
                        fontFamily="mono"
                        minH="100%"
                    />
                </Box>
            </Stack>
            <Stack p={4} spacing={4} borderRadius="md" borderWidth={1} flex={1}>
                <Heading size="md">Problem {idx + 1}</Heading>
                <MathJax math={state} />
            </Stack>
        </Stack>
    );
};

const Test = () => {
    const {
        data: test,
        problemsRef,
        problemsData: { problems = [] },
    } = useTest();

    const handleUpdate = (idx, val) => {
        problems[idx] = val;
        problemsRef.set({ problems }, { merge: true });
    };

    const handleAdd = () => {
        problems.push("");
        problemsRef.set({ problems }, { merge: true });
    };

    return (
        <Stack spacing={4}>
            <Heading size="lg">{test.name}</Heading>
            {problems.map((x, idx) => (
                <Problem text={x} key={idx} idx={idx} onUpdate={val => handleUpdate(idx, val)} />
            ))}
            <Button colorScheme="blue" alignSelf="flex-start" onClick={handleAdd}>
                Add Problem
            </Button>
        </Stack>
    );
};

const TestTab = () => (
    <TestProvider>
        <Test />
    </TestProvider>
);

export default TestTab;
