/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Box, Button, Heading, Stack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import MathJax from "~/components/MathJax";
import Card from "~/components/Card";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import ResizingTextarea from "~/components/ResizingTextarea";

const Editor = ({ label, text, onUpdate, isLoading, error }) => {
  const [state, setState] = useState(text);

  useEffect(() => {
    setState(text);
  }, [text]);

  return (
    <Stack spacing={4} direction="row">
      <Card as={Stack} p={4} spacing={4} flex={1}>
        <Heading size="md">{label}</Heading>
        <Box flex={1}>
          <ResizingTextarea value={state} onChange={(e) => setState(e.target.value)} fontFamily="mono" minH="100%" />
        </Box>
        {text !== state && (
          <Button onClick={() => onUpdate(state)} isLoading={isLoading} alignSelf="flex-start">
            Save &amp; Publish
          </Button>
        )}
      </Card>
      <Card as={Stack} p={4} spacing={4} flex={1}>
        <Heading size="md">{label}</Heading>
        <MathJax math={state} />
      </Card>
    </Stack>
  );
};

const Test = () => {
  const { ref: testRef, data: test } = useTest();

  const handleUpdate = async (values) => {
    await testRef.update(values);
  };

  return (
    <Stack spacing={4}>
      <Heading size="lg">{test.name}</Heading>
      <Editor label="Rules" text={test.rules ?? ""} onUpdate={(x) => handleUpdate({ rules: x })} />
      <Editor
        label="Clarifications"
        text={test.clarifications ?? ""}
        onUpdate={(x) => handleUpdate({ clarifications: x })}
      />
    </Stack>
  );
};

const TestTab = () => (
  <TestProvider>
    <Test />
  </TestProvider>
);

export default TestTab;
