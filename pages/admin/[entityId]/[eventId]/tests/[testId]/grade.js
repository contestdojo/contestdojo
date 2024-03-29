/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Button,
  Checkbox,
  Divider,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import TeX from "@matejmazur/react-katex";
import firebase from "firebase";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { HiCheck, HiX } from "react-icons/hi";
import { useAuth, useFirestoreCollectionData, useFirestoreDocData } from "reactfire";

import MathJax from "~/components/MathJax";
import BlankCard from "~/components/BlankCard";
import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import AsciiMathParser from "~/helpers/asciimath2tex";
import { useFormState } from "~/helpers/utils";

const parser = new AsciiMathParser();

const Answer = ({ text, correct, count, onUpdate }) => {
  return (
    <WrapItem
      as={Card}
      flex={1}
      maxW="md"
      flexBasis={300}
      minH="16"
      borderColor={correct === true ? "green.500" : correct === false ? "red.500" : undefined}
      backgroundColor={correct === true ? "green.50" : correct === false ? "red.50" : undefined}
    >
      <HStack p={4} flex="1" overflow="scroll" height="full">
        <TeX math={text} />
        <Text color={correct === undefined ? "gray.500" : "gray.300"}>&times;{count}</Text>
      </HStack>
      <Stack spacing={0} height="100%">
        <IconButton
          flex={1}
          size="sm"
          variant="ghost"
          colorScheme={correct === true ? "green" : undefined}
          icon={<HiCheck />}
          onClick={() => onUpdate(true)}
          borderRadius={0}
        />
        <IconButton
          flex={1}
          size="sm"
          variant="ghost"
          colorScheme={correct === false ? "red" : undefined}
          icon={<HiX />}
          onClick={() => onUpdate(false)}
          borderRadius={0}
        />
      </Stack>
    </WrapItem>
  );
};

const AddAnswerModal = ({ isOpen, onClose, onUpdate }) => {
  const [{ isLoading, error }, wrapAction] = useFormState();
  const ref = useRef();

  const [value, setValue] = useState("");
  const [correct, setCorrect] = useState(true);
  const rendered = value && parser.parse(value);

  useEffect(() => {
    setValue("");
  }, [isOpen]);

  const handleSubmit = wrapAction(async () => {
    await onUpdate({ [rendered]: correct });
    onClose();
  });

  return (
    <Modal isOpen={isOpen} initialFocusRef={ref} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Answer</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <form
            id="add-answer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <Stack spacing={4}>
              <Input
                ref={ref}
                value={value ?? ""}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter math..."
                isRequired
              />
              {rendered && <TeX math={rendered} />}
              <Checkbox isChecked={correct} onChange={(e) => setCorrect(e.target.checked)}>
                Correct
              </Checkbox>
            </Stack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button type="submit" form="add-answer" colorScheme="blue" isLoading={isLoading} mr={3}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Problem = ({ text, idx, answers, correct, onUpdate }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: event } = useEvent();

  const { eventId, testId } = useRouter().query;
  const [state, setState] = useState(text);
  const [{ isLoading }, wrapAction] = useFormState();
  const [gradeLoading, setGradeLoading] = useState(false);

  const auth = useAuth();

  const answersMap = {};
  for (const ans of Object.keys(correct)) {
    answersMap[ans] = answersMap[ans] ?? 0;
  }
  for (const ans of answers) {
    if (ans === undefined) continue;
    answersMap[ans] = (answersMap[ans] ?? 0) + 1;
  }
  const shownAnswers = Object.entries(answersMap).sort((a, b) => {
    if (b[1] === a[1]) return b[0].localeCompare(a[0]);
    return b[1] - a[1];
  });

  useEffect(() => {
    setState(text);
  }, [text]);

  const handleMarkRest = wrapAction(async () => {
    const upd = {};
    for (const [ans] of shownAnswers) {
      const val = correct[ans];
      if (val !== undefined) continue;
      upd[ans] = false;
    }
    if (Object.keys(upd).length === 0) return;
    onUpdate(upd);
  });

  const handleRegrade = async () => {
    setGradeLoading(true);
    const authorization = await auth.currentUser.getIdToken();
    await fetch(`/api/admin/${event.owner.id}/${eventId}/tests/${testId}/grade`, {
      method: "POST",
      headers: { authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ problemIdx: idx }),
    });
    setGradeLoading(false);
  };

  return (
    <Stack spacing={4} flex="1">
      <Card as={Stack} p={4} spacing={4}>
        <Heading size="md">Problem {idx + 1}</Heading>
        <MathJax key={state} math={state} msDelayDisplay={200} />
      </Card>
      <Divider />
      <HStack>
        <Heading size="md" flex="1">
          Answers
        </Heading>
        <Button onClick={onOpen} isLoading={isLoading}>
          Add Answer
        </Button>
        <Button onClick={handleMarkRest} isLoading={isLoading}>
          Mark Rest Incorrect
        </Button>
        <Button onClick={handleRegrade} isLoading={gradeLoading}>
          Re-grade Tests
        </Button>
      </HStack>
      <Wrap>
        {shownAnswers.map(([x, count]) => (
          <Answer
            key={x}
            text={x}
            correct={correct[x]}
            count={count}
            onUpdate={(status) => onUpdate({ [x]: status })}
          />
        ))}
        {shownAnswers.length === 0 && <BlankCard>Answers will appear here</BlankCard>}
      </Wrap>
      <AddAnswerModal isOpen={isOpen} onClose={onClose} onUpdate={onUpdate} />
    </Stack>
  );
};

const Navigation = ({ selected, total, onSelect }) => (
  <Stack flexBasis={150}>
    {[...Array(total).keys()].map((idx) => (
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
  const { data: answers = {} } = useFirestoreDocData(answersRef);

  const [index, setIndex] = useState(0);

  const handleUpdate = async (toUpdate) => {
    if (Object.keys(answers).length === 0) {
      await answersRef.set({}, { merge: true });
    }
    const args = [];
    for (const [ans, status] of Object.entries(toUpdate)) {
      const path = new firebase.firestore.FieldPath(index.toString(), ans);
      args.push(path, status);
    }
    await answersRef.update(...args);
  };

  return (
    <Stack spacing={4}>
      <Heading size="lg">{test.name}</Heading>
      <Stack direction="row" spacing={4} flex="1">
        <Navigation selected={index} total={problems.length} onSelect={setIndex} />
        <Divider orientation="vertical" />
        {problems.length > 0 && (
          <Problem
            text={problems[index]}
            idx={index}
            answers={submissions.map((x) => x[`${index}r`])}
            correct={answers[index] ?? {}}
            onUpdate={handleUpdate}
          />
        )}
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
