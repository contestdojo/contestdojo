/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Box, Button, Heading, HStack, IconButton, Stack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { HiTrash } from "react-icons/hi";

import MathJax from "~/components/MathJax";
import Card from "~/components/Card";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import ResizingTextarea from "~/components/ResizingTextarea";
import { useFormState } from "~/helpers/utils";

const Problem = ({ text, idx, onUpdate, isLoading, onDelete, error }) => {
  const [state, setState] = useState(text);

  useEffect(() => {
    setState(text);
  }, [text]);

  return (
    <Stack spacing={4} direction="row">
      <Card as={Stack} p={4} spacing={4} flex={1}>
        <HStack justifyContent="space-between">
          <Heading size="md">Problem {idx + 1}</Heading>
          <IconButton icon={<HiTrash />} variant="ghost" size="sm" rounded="full" onClick={onDelete} />
        </HStack>
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
        <Heading size="md">Problem {idx + 1}</Heading>
        <MathJax math={state} />
      </Card>
    </Stack>
  );
};

const Test = () => {
  const {
    data: test,
    problemsRef,
    problemsData: { problems = [] },
  } = useTest();

  const [{ isLoading }, wrapAction] = useFormState({ multiple: true });

  const handleUpdate = wrapAction((idx, val) => {
    problems[idx] = val;
    problemsRef.set({ problems }, { merge: true });
  });

  const handleAdd = wrapAction((_arg) => {
    problems.push("");
    problemsRef.set({ problems }, { merge: true });
  });

  const handleDelete = wrapAction((idx) => {
    problems.splice(idx, 1);
    problemsRef.set({ problems }, { merge: true });
  });

  return (
    <Stack spacing={4}>
      <Heading size="lg">{test.name}</Heading>
      {problems.map((x, idx) => (
        <Problem
          text={x}
          key={idx}
          idx={idx}
          onUpdate={(val) => handleUpdate(idx, val)}
          isLoading={isLoading === idx.toString()}
          onDelete={() => handleDelete(idx)}
        />
      ))}
      <Button
        colorScheme="blue"
        alignSelf="flex-start"
        onClick={() => handleAdd("add")}
        isLoading={isLoading === "add"}
      >
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
