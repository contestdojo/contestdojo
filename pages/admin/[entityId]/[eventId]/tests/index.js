import AddTestForm from "~/components/forms/AddTestForm";
import { Button, IconButton } from "@chakra-ui/button";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/layout";
import { Tooltip } from "@chakra-ui/tooltip";
import dayjs from "dayjs";
import firebase from "firebase";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { HiClipboardCheck, HiPencilAlt, HiTable } from "react-icons/hi";
import { useFirestoreCollectionData } from "reactfire";
import Card from "~/components/Card";
import { useDialog } from "~/components/contexts/DialogProvider";
import { useEvent } from "~/components/contexts/EventProvider";
import { toDict, useFormState, useTime } from "~/helpers/utils";

const TooltipLink = ({ label, href, children }) => (
    <Tooltip label={label}>
        <Box>
            <NextLink href={href} passHref>
                {children}
            </NextLink>
        </Box>
    </Tooltip>
);

const TestCard = ({ id, name, team, duration, openTime: rawOpenTime, closeTime: rawCloseTime, time, onOpen }) => {
    const router = useRouter();
    const { entityId, eventId } = router.query;

    const openTime = rawOpenTime && dayjs(rawOpenTime?.toDate());
    const closeTime = rawCloseTime && dayjs(rawCloseTime?.toDate());
    const open = time.isAfter(openTime) && time.isBefore(closeTime);

    return (
        <Card as={HStack} p={4} key={id}>
            <Box flex="1">
                <Heading size="md">
                    {name}
                    {team && " (Team)"}
                </Heading>
                <Text color="gray.500">Duration: {duration / 60} minutes</Text>
                {open && <Text color="red.500">Closes {closeTime.format("MM/DD/YYYY h:mm A")}</Text>}
            </Box>

            <TooltipLink label="Edit Problems" href={`/admin/${entityId}/${eventId}/tests/${id}`}>
                <IconButton as="a" icon={<HiPencilAlt />} />
            </TooltipLink>

            <TooltipLink label="Grade Tests" href={`/admin/${entityId}/${eventId}/tests/${id}/grade`}>
                <IconButton as="a" icon={<HiClipboardCheck />} />
            </TooltipLink>

            <TooltipLink label="View Results" href={`/admin/${entityId}/${eventId}/tests/${id}/submissions`}>
                <IconButton as="a" icon={<HiTable />} />
            </TooltipLink>

            <Button colorScheme="blue" onClick={onOpen} minW={150} disabled={open}>
                {open ? "Open" : openTime ? "Reopen Test" : "Open Test"}
            </Button>
        </Card>
    );
};

const TestsTab = () => {
    const { ref: eventRef } = useEvent();
    const time = useTime();

    const testsRef = eventRef.collection("tests");
    const { data: tests } = useFirestoreCollectionData(testsRef, { idField: "id" });
    let testsById = tests.reduce(toDict, {});

    const [formState, wrapAction] = useFormState();
    const [openDialog] = useDialog();

    const handleOpenTest = openTest => async () => {
        const now = new Date();
        await testsRef.doc(openTest.id).update({
            openTime: firebase.firestore.Timestamp.fromDate(now),
            closeTime: firebase.firestore.Timestamp.fromDate(
                new Date(now.getTime() + (openTest.duration + 10 * 60) * 1000)
            ),
        });
    };

    const handleAddTest = wrapAction(async ({ name, type, duration, team }) => {
        await testsRef.add({
            name,
            type,
            duration,
            team,
        });
    });

    return (
        <Stack spacing={4}>
            {Object.values(testsById).map(x => (
                <TestCard
                    {...x}
                    time={time}
                    onOpen={() =>
                        openDialog({
                            type: "confirm",
                            title: "Are you sure?",
                            description: `This will open the test for all students for a window of ${
                                x?.duration / 60 + 10
                            } minutes. Confirm?`,
                            onConfirm: handleOpenTest(x),
                        })
                    }
                />
            ))}
            <Card as={Stack} spacing={4} p={4} maxW="md">
                <Heading size="md">Add Test</Heading>
                <AddTestForm buttonText="Add Test" onSubmit={handleAddTest} {...formState} />
            </Card>
        </Stack>
    );
};

export default TestsTab;
