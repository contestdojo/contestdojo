import { Alert, AlertIcon } from "@chakra-ui/alert";
import { Button } from "@chakra-ui/button";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/layout";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useFirestoreCollectionData, useFirestoreDoc, useFirestoreDocData, useFunctions, useUser } from "reactfire";

import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import { useFormState, useTime } from "~/helpers/utils";

const TestCard = ({ id, name, team, duration, onStart, isLoading, student, time }) => {
  const [openDialog] = useDialog();
  const { ref: eventRef } = useEvent();

  const sid = team ? student.team.id : student.id;
  const submissionRef = eventRef.collection("tests").doc(id).collection("submissions").doc(sid);
  const { data: submission } = useFirestoreDoc(submissionRef);

  const handleClick = () => {
    if (submission.exists) {
      onStart();
    } else {
      openDialog({
        type: "confirm",
        title: "Are you sure?",
        description: team
          ? "By starting the test, your timer will begin for the entire team. Please communicate with your team members to ensure you are ready."
          : "By starting the test, your timer will begin. Please ensure you are ready.",
        onConfirm: onStart,
      });
    }
  };

  let finished = false;
  if (submission.exists) {
    const endTime = dayjs(submission.data().endTime.toDate());
    finished = time.isAfter(endTime);
  }

  return (
    <Card as={HStack} p={4} key={id}>
      <Box flex="1">
        <Heading size="md">{name}</Heading>
        <Text color="gray.500">Duration: {duration / 60} minutes</Text>
      </Box>
      <Button colorScheme="blue" onClick={handleClick} isLoading={isLoading === id} disabled={finished}>
        {finished ? "Submitted" : submission.exists ? "Resume" : "Start"}
      </Button>
    </Card>
  );
};

const Tests = () => {
  const { data: user } = useUser();
  const { ref: eventRef, data: event } = useEvent();
  const time = useTime();
  const router = useRouter();

  const studentRef = eventRef.collection("students").doc(user.uid);
  const { data: student } = useFirestoreDocData(studentRef, { idField: "id" });

  const T_indivtests = ["general", "algebra", "combinatorics", "geometry", "nt"];
  let eligibleTests = student.test1 == "general" ? ["general"] : [student.test1 ?? "", student.test2 ?? ""];
  eligibleTests = T_indivtests.filter((x) => eligibleTests.includes(x));

  const testsRef = eventRef.collection("tests");
  const { data: tests } = useFirestoreCollectionData(testsRef, { idField: "id" });
  // let displayTests = tests;

  let displayTests = tests.filter(
    (x) => x.openTime && x.openTime.toDate() < time.toDate() && time.toDate() < x.closeTime.toDate()
  );
  displayTests = displayTests.filter(
    (x) =>
      !T_indivtests.includes(x.id) ||
      (x.id === eligibleTests[0] && x.openSplit === 0) ||
      (x.id === eligibleTests[1] && x.openSplit === 1)
  );

  const functions = useFunctions();
  const startTest = functions.httpsCallable("startTest");

  const [{ isLoading, error }, wrapAction] = useFormState({ multiple: true });

  const handleStartTest = wrapAction(async (testId) => {
    await startTest({ eventId: "smt21", testId });
    router.push(`/student/smt21/tests/${testId}`);
  });

  return (
    <Stack spacing={4} flexBasis={600}>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error.message}
        </Alert>
      )}

      {student.test1 !== "general" && (!student.test1 || !student.test2) ? (
        <Alert status="error">
          <AlertIcon />
          You must select individual tests before selecting a test.
        </Alert>
      ) : student.waiverSigned ? (
        <>
          <Text>
            {displayTests.length === 0
              ? "You do not have any available tests at the moment."
              : "The following tests are available for you to take:"}
          </Text>

          {displayTests.map((x) => (
            <TestCard
              key={x.id}
              {...x}
              onStart={() => handleStartTest(x.id)}
              isLoading={isLoading}
              student={student}
              time={time}
            />
          ))}
        </>
      ) : (
        <Alert status="error">
          <AlertIcon />
          You must complete your waiver before taking tests.
        </Alert>
      )}

      <ButtonLink href={`/student/smt21`} colorScheme="blue" alignSelf="flex-start">
        Back to {event.name}
      </ButtonLink>
    </Stack>
  );
};

export default Tests;
