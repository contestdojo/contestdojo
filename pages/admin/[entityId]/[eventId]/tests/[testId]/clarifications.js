import { Box, Button, Heading, Stack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import MathJax from "react-mathjax-preview";
import Card from "~/components/Card";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import ResizingTextarea from "~/components/ResizingTextarea";

const Editor = ({ text, onUpdate, isLoading, error }) => {
    const [state, setState] = useState(text);

    useEffect(() => {
        setState(text);
    }, [text]);

    return (
        <Stack spacing={4} direction="row">
            <Card as={Stack} p={4} spacing={4} flex={1}>
                <Heading size="md">Clarifications</Heading>
                <Box flex={1}>
                    <ResizingTextarea
                        value={state}
                        onChange={e => setState(e.target.value)}
                        fontFamily="mono"
                        minH="100%"
                    />
                </Box>
                {text !== state && (
                    <Button onClick={() => onUpdate(state)} isLoading={isLoading} alignSelf="flex-start">
                        Save &amp; Publish
                    </Button>
                )}
            </Card>
            <Card as={Stack} p={4} spacing={4} flex={1}>
                <Heading size="md">Clarifications</Heading>
                <MathJax math={state} />
            </Card>
        </Stack>
    );
};

const Test = () => {
    const { ref: testRef, data: test } = useTest();

    const handleUpdate = async clarifications => {
        await testRef.update({ clarifications });
    };

    return (
        <Stack spacing={4}>
            <Heading size="lg">{test.name}</Heading>
            <Editor text={test.clarifications ?? ""} onUpdate={handleUpdate} />
        </Stack>
    );
};

const TestTab = () => (
    <TestProvider>
        <Test />
    </TestProvider>
);

export default TestTab;
