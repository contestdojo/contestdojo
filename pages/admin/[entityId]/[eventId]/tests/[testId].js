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

const Tests = () => {
    const { ref: testRef, data: test } = useTest();

    const handleUpdate = (idx, val) => {
        test.problems[idx] = val;
        testRef.update({ problems: test.problems });
    };

    const handleAdd = () => {
        test.problems.push("");
        testRef.update({ problems: test.problems });
    };

    return (
        <Stack spacing={4}>
            <Heading size="lg">{test.name}</Heading>
            {test.problems.map((x, idx) => (
                <Problem text={x} key={idx} idx={idx} onUpdate={val => handleUpdate(idx, val)} />
            ))}
            <Button colorScheme="blue" alignSelf="flex-start" onClick={handleAdd}>
                Add Problem
            </Button>
        </Stack>
    );
};

const TestsTab = () => (
    <TestProvider>
        <Tests />
    </TestProvider>
);

export default TestsTab;
