/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Box, chakra, Collapse, Heading, Stack, Text, useDisclosure } from "@chakra-ui/react";
import TeX from "@matejmazur/react-katex";
import MathJax from "react-mathjax-preview";
import { Sticky } from "react-sticky";
import { useFirestoreDocData, useUser } from "reactfire";

import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import AsciiMathParser from "~/helpers/asciimath2tex";

const parser = new AsciiMathParser();

const Problem = ({ text, idx, submission, graded, solution }) => {
  const rendered = submission && parser.parse(submission);

  return (
    <Card as={Stack} p={4} spacing={4} flex={1}>
      <Heading size="md">Problem {idx + 1}</Heading>
      <MathJax math={text} config={{ menuSettings: { inTabOrder: false } }} />

      {(submission || solution) && (
        <Stack direction="row">
          {submission && (
            <Card
              flex={1}
              as={Stack}
              p={4}
              spacing={4}
              backgroundColor={graded === 0 ? "red.50" : graded === 1 ? "green.50" : undefined}
              borderColor={graded === 0 ? "red.500" : graded === 1 ? "green.500" : undefined}
              borderWidth={graded !== undefined ? 2 : 1}
            >
              <Heading size="sm">Your Submission</Heading>
              <TeX math={rendered} />
              <Text color="gray.500" fontSize="sm">
                Raw: <chakra.span fontFamily="mono">{submission}</chakra.span>
              </Text>
            </Card>
          )}

          {solution && (
            <Card flex={1} as={Stack} p={4} spacing={4}>
              <Heading size="sm">Correct Answer</Heading>
              <TeX math={solution} />
            </Card>
          )}
        </Stack>
      )}
    </Card>
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

  const studentRef = eventRef.collection("students").doc(user.uid);
  const { data: student } = useFirestoreDocData(studentRef);

  const submissionId = test.team ? student.team.id : user.uid;
  const submissionRef = testRef.collection("submissions").doc(submissionId);
  const { data: submission } = useFirestoreDocData(submissionRef);

  const gradedRef = testRef.collection("graded").doc(submissionId);
  const { data: graded } = useFirestoreDocData(gradedRef);

  const solutionsRef = testRef.collection("private").doc("solutions");
  const { data: solutions } = useFirestoreDocData(solutionsRef);

  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  if (!submission.startTime) {
    return (
      <Alert status="error">
        <AlertIcon />
        Submission Not Found
      </Alert>
    );
  }

  return (
    <Stack direction="row" spacing={4}>
      <Stack spacing={4} flex={1}>
        <Heading size="lg">{test.name}</Heading>

        {problems.map((x, idx) => (
          <Problem
            key={idx}
            idx={idx}
            text={x}
            submission={submission[idx]}
            graded={graded[idx]}
            solution={solutions?.[idx]}
          />
        ))}
      </Stack>

      <Stack flexBasis={300} flexShrink={0} spacing={4} style={{ marginTop: "-1rem" }}>
        <Sticky relative>
          {({ style }) => (
            <Stack spacing={4} mt={4} {...style}>
              {test.rules && (
                <Card as={Stack} spacing={0} p={4} onClick={onToggle} cursor="pointer" position="relative">
                  <Heading size="md">Round Rules</Heading>
                  <Collapse in={isOpen} animateOpacity>
                    <Box mt={4}>
                      <MathJax math={test.rules} />
                    </Box>
                  </Collapse>
                  <Text fontSize="xs" color="gray.500" position="absolute" bottom={2} right={2}>
                    Click to {isOpen ? "collapse" : "expand"}
                  </Text>
                </Card>
              )}

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

export default Test;

Test.layoutProps = {
  maxW: 2000,
};
