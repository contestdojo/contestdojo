import { Button, Heading, Stack, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import MathJax from "react-mathjax-preview";
import { useFirestoreCollectionData } from "reactfire";
import TestProvider, { useTest } from "~/contexts/TestProvider";

const Problem = ({ text, idx, answers }) => {
    const [state, setState] = useState(text);

    useEffect(() => {
        setState(text);
    }, [text]);

    return (
        <Stack spacing={4} flex="1">
            <Stack p={4} spacing={4} borderRadius="md" borderWidth={1} flex={1}>
                <Heading size="md">Problem {idx + 1}</Heading>
                <MathJax math={state} />
            </Stack>
            <Wrap>
                {answers.map(x => (
                    <WrapItem as={Stack} key={x} p={4} borderRadius="md" borderWidth={1} flex={1} maxW="md">
                        <MathJax math={`\`${x}\``} />
                    </WrapItem>
                ))}
            </Wrap>
        </Stack>
    );
};

const Navigation = ({ selected, total, onSelect }) => (
    <Stack>
        {[...Array(total).keys()].map(idx => (
            <Button key={idx} onClick={() => onSelect(idx)} colorScheme={selected == idx ? "blue" : undefined}>
                Problem {idx}
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

    const [index, setIndex] = useState(0);

    return (
        <Stack spacing={4}>
            <Heading size="lg">{test.name}</Heading>
            <Stack direction="row" spacing={4}>
                <Navigation selected={index} total={problems.length} onSelect={setIndex} />
                <Problem
                    text={problems[index]}
                    idx={index}
                    answers={submissions.map(x => x[index]).filter(x => x !== undefined)}
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
