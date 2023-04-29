/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Button, Heading, Icon, Stack, Td } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { HiCheck, HiMinus, HiX } from "react-icons/hi";
import MathJax from "react-mathjax-preview";
import { useAuth, useFirestoreCollectionData } from "reactfire";

import AdminTableView, { sumReducer } from "~/components/AdminTableView";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import { toDict, useFormState } from "~/helpers/utils";

const mathmlRenderer = (val) => <MathJax math={val} />;

const COLORS = {
  correct: "green",
  incorrect: "red",
  ungraded: "orange",
  blank: "gray",
};

const ICONS = {
  correct: HiCheck,
  incorrect: HiX,
  ungraded: HiMinus,
  blank: HiMinus,
};

const rightWrongRenderer = (val) => {
  const status = val > 0 ? "correct" : val === 0 ? "incorrect" : val === null ? "ungraded" : "blank";
  return (
    <Td background={status === "blank" ? undefined : COLORS[status] + ".100"}>
      <Icon as={ICONS[status]} color={COLORS[status]} />
    </Td>
  );
};

const Submissions = () => {
  const { ref: eventRef, data: event } = useEvent();
  const { eventId, testId } = useRouter().query;
  const {
    ref: testRef,
    data: test,
    problemsData: { problems = [] },
  } = useTest();

  // Submissions
  const submissionsRef = testRef.collection("submissions");
  const { data: submissions } = useFirestoreCollectionData(submissionsRef, { idField: "id" });
  const gradedRef = testRef.collection("graded");
  const { data: graded } = useFirestoreCollectionData(gradedRef, { idField: "id" });
  const gradedById = graded.reduce(toDict, {});

  // Students
  const studentsRef = eventRef.collection("students");
  const { data: students } = useFirestoreCollectionData(studentsRef, { idField: "id" });
  const studentsById = students.reduce(toDict, {});

  // Teams
  const teamsRef = eventRef.collection("teams");
  const { data: teams } = useFirestoreCollectionData(teamsRef, { idField: "id" });
  const teamsById = teams.reduce(toDict, {});

  // funcs
  const auth = useAuth();
  const [{ isLoading }, wrapAction] = useFormState();
  const [openDialog] = useDialog();

  const handleRegrade = wrapAction(async () => {
    const authorization = await auth.currentUser.getIdToken();
    await fetch(`/api/admin/${event.owner.id}/${eventId}/tests/${testId}/grade`, {
      method: "POST",
      headers: { authorization },
    });
  });

  const handleRelease = () => {
    openDialog({
      type: "confirm",
      title: "Are you sure?",
      description: "Students will be able to view their graded tests.",
      onConfirm: wrapAction(async () => {
        await handleRegrade();
        await testRef.update({ resultsReleased: true });
      }),
    });
  };

  // Make table

  const cols = [
    { label: test.team ? "ID" : " Student ID", key: "id", hideByDefault: true },
    { label: "#", key: "number" },
    { label: test.team ? "Team Name" : " Student Name", key: "name" },
    { label: "Score", key: "score" },
    { label: "Start Time", key: "startTime", hideByDefault: true },
    ...problems.map((x, idx) => ({ label: `A${idx + 1}`, key: `${idx}`, hideByDefault: true })),
    ...problems.map((x, idx) => ({
      label: `C${idx + 1}`,
      key: `c${idx}`,
      renderer: rightWrongRenderer,
      skipCell: true,
      reducer: (arr) => sumReducer(arr.map(Boolean)),
    })),
    ...problems.map((x, idx) => ({ label: `T${idx + 1}`, key: `t${idx}`, hideByDefault: true })),
  ];

  const rows = submissions.map((s) => {
    const startTime = dayjs(s.startTime.toDate());
    const answers = problems.map((x, idx) => [idx, s[idx] ?? null]);
    const correct = problems.map((x, idx) => [`c${idx}`, s[`${idx}r`] ? gradedById[s.id]?.[idx] ?? null : undefined]);
    const times = problems.map((x, idx) => [
      `t${idx}`,
      s[`${idx}t`] && dayjs.duration(dayjs(s[`${idx}t`].toDate()).diff(startTime)).format("HH:mm:ss"),
    ]);
    const total = sumReducer(correct.map(([idx, x]) => Boolean(x)));

    return {
      id: s.id,
      number: (test.team ? teamsById[s.id] : studentsById[s.id])?.number,
      name: test.team ? teamsById[s.id]?.name : `${studentsById[s.id]?.fname} ${studentsById[s.id]?.lname}`,
      score: total,
      startTime: startTime.format("M/D/YYYY h:mm A"),
      ...Object.fromEntries(answers),
      ...Object.fromEntries(correct),
      ...Object.fromEntries(times),
    };
  });

  return (
    <Stack spacing={4}>
      <Heading size="lg">{test.name}</Heading>
      <AdminTableView
        cols={cols}
        rows={rows}
        defaultSortKey="score"
        defaultSortOrder="dsc"
        filename={`${test.id}.csv`}
        tableProps={{ variant: "lined" }}
        extraButtons={
          <>
            <Button onClick={handleRelease} isLoading={isLoading}>
              Release Results
            </Button>
            <Button onClick={handleRegrade} isLoading={isLoading}>
              Re-grade All
            </Button>
          </>
        }
      />
    </Stack>
  );
};

const SubmissionsTab = () => (
  <TestProvider>
    <Submissions />
  </TestProvider>
);

export default SubmissionsTab;
