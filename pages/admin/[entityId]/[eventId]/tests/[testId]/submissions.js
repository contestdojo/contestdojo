import { Heading, Icon, Stack, Td } from "@chakra-ui/react";
import { HiCheck, HiX } from "react-icons/hi";
import MathJax from "react-mathjax-preview";
import { useFirestoreCollectionData } from "reactfire";
import AdminTableView, { sumReducer } from "~/components/AdminTableView";
import { useEvent } from "~/components/contexts/EventProvider";
import TestProvider, { useTest } from "~/components/contexts/TestProvider";
import { toDict } from "~/helpers/utils";

const mathmlRenderer = val => <MathJax math={val} />;

const rightWrongRenderer = val => (
    <Td background={val ? "green.100" : "red.100"}>
        {val ? <Icon as={HiCheck} color="green" /> : <Icon as={HiX} color="red" />}
    </Td>
);

const Submissions = () => {
    const { ref: eventRef } = useEvent();
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

    // Make table

    const cols = [
        { label: test.team ? "Team ID" : " Student ID", key: "id", hideByDefault: true },
        { label: test.team ? "Team Name" : " Student Name", key: "name" },
        { label: "Score", key: "score" },
        ...problems.map((x, idx) => ({ label: `A${idx + 1}`, key: `${idx}`, hideByDefault: true })),
        ...problems.map((x, idx) => ({
            label: `C${idx + 1}`,
            key: `c${idx}`,
            renderer: rightWrongRenderer,
            skipCell: true,
            reducer: sumReducer,
        })),
    ];

    const rows = submissions.map(s => {
        const answers = problems.map((x, idx) => [idx, s[idx] ?? ""]);
        const correct = problems.map((x, idx) => [`c${idx}`, !!gradedById[s.id]?.[idx]]);
        const total = sumReducer(correct.map(([idx, x]) => x));

        return {
            id: s.id,
            name: test.team ? teamsById[s.id]?.name : `${studentsById[s.id].fname} ${studentsById[s.id].lname}`,
            score: total,
            ...Object.fromEntries(answers),
            ...Object.fromEntries(correct),
        };
    });

    console.log(cols, rows);

    return (
        <Stack spacing={4}>
            <Heading size="lg">{test.name}</Heading>
            <AdminTableView
                cols={cols}
                rows={rows}
                defaultSortKey="score"
                defaultSortOrder="dsc"
                filename={`${test.id}.csv`}
                tableProps={{ variant: "lined", size: "sm" }}
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
