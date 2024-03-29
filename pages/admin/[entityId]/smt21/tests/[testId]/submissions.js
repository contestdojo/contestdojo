import { Button, Heading, Icon, Stack, Td } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { HiCheck, HiMinus, HiX } from "react-icons/hi";
import MathJax from "react-mathjax-preview";
import { useFirestoreCollectionData, useFunctions } from "reactfire";

import AdminTableView, { sumReducer } from "~/components/AdminTableView";
import { useEvent } from "~/components/contexts/EventProvider";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import { toDict, useFormState } from "~/helpers/utils";

const mathmlRenderer = (val) => <MathJax math={val} />;

const COLORS = {
  correct: "green",
  incorrect: "red",
  ungraded: "orange",
};

const ICONS = {
  correct: HiCheck,
  incorrect: HiX,
  ungraded: HiMinus,
};

const rightWrongRenderer = (val) => {
  console.log(val);
  const status = val > 0 ? "correct" : val === 0 ? "incorrect" : "ungraded";
  return (
    <Td background={COLORS[status] + ".100"}>
      <Icon as={ICONS[status]} color={COLORS[status]} />
    </Td>
  );
};

const Submissions = () => {
  const { ref: eventRef } = useEvent();
  const { testId } = useRouter().query;
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
  const functions = useFunctions();
  const gradeTests = functions.httpsCallable("gradeTests");
  const [{ isLoading }, wrapAction] = useFormState();

  const handleClick = wrapAction(async () => {
    await gradeTests({ eventId: "smt21", testId });
  });

  // Make table

  const cols = [
    { label: test.team ? "ID" : " Student ID", key: "id", hideByDefault: true },
    { label: "#", key: "number" },
    { label: test.team ? "Team Name" : " Student Name", key: "name" },
    { label: "Division", key: "division" },
    { label: "Score", key: "score" },
    ...problems.map((x, idx) => ({ label: `A${idx + 1}`, key: `${idx}`, hideByDefault: true })),
    ...problems.map((x, idx) => ({
      label: `C${idx + 1}`,
      key: `c${idx}`,
      renderer: rightWrongRenderer,
      skipCell: true,
      reducer: sumReducer,
    })),
    ...problems.map((x, idx) => ({ label: `T${idx + 1}`, key: `t${idx}`, hideByDefault: true })),
  ];

  const rows = submissions.map((s) => {
    const startTime = dayjs(s.startTime.toDate());
    const div = (test.team ? teamsById[s.id] : teamsById[studentsById[s.id].team.id])?.division;
    const answers = problems.map((x, idx) => [idx, s[idx] ?? null]);
    const correct = problems.map((x, idx) => [`c${idx}`, gradedById[s.id]?.[idx] ?? null]);
    const times = problems.map((x, idx) => [
      `t${idx}`,
      s[`${idx}t`] && dayjs.duration(dayjs(s[`${idx}t`].toDate()).diff(startTime)).format("HH:mm:ss"),
    ]);
    const total = sumReducer(correct.map(([idx, x]) => x));

    return {
      id: s.id,
      number: (test.team ? teamsById[s.id] : studentsById[s.id])?.number,
      name: test.team ? teamsById[s.id]?.name : `${studentsById[s.id].fname} ${studentsById[s.id].lname}`,
      division: div === 0 ? "Tree" : div === 1 ? "Sapling" : "",
      score: total,
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
          <Button onClick={handleClick} isLoading={isLoading}>
            Re-grade All
          </Button>
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
