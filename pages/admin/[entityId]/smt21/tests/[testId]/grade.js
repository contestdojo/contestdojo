import { Button, Divider, Heading, HStack, IconButton, Stack, Text, Wrap, WrapItem } from "@chakra-ui/react";
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
import { useFormState } from "~/helpers/utils";

const Answer = ({ text, correct, count, onUpdate }) => {
  return (
    <WrapItem as={Card} flex={1} maxW="md" flexBasis={200} backgroundColor={correct === undefined && "orange.100"}>
      <HStack p={4} flex="1">
        {text.startsWith("<math>") ? <MathJax math={text} /> : <TeX math={text} />}
        <Text color={correct === undefined ? "gray.500" : "gray.300"}>&times;{count}</Text>
      </HStack>
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
  const { testId } = useRouter().query;
  const [state, setState] = useState(text);
  const [{ isLoading }, wrapAction] = useFormState();
  const [gradeLoading, setGradeLoading] = useState(false);

  const functions = useFunctions();
  const gradeTests = functions.httpsCallable("gradeTests");

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
    await gradeTests({ eventId: "smt21", testId, problemIdx: idx });
    setGradeLoading(false);
  };

  return (
    <Stack spacing={4} flex="1">
      <Card as={Stack} p={4} spacing={4}>
        <Heading size="md">Problem {idx + 1}</Heading>
        <MathJax math={state} msDelayDisplay={0} />
      </Card>
      <Divider />
      <HStack>
        <Heading size="md" flex="1">
          Answers
        </Heading>
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
  const { data: answers } = useFirestoreDocData(answersRef);

  const [index, setIndex] = useState(0);

  const handleUpdate = async (toUpdate) => {
    if (Object.keys(answers).length === 1) {
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
        <Problem
          text={problems[index]}
          idx={index}
          answers={submissions.map((x) => x[`${index}r`])}
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
