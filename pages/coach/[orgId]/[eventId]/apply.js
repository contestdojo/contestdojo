import { Alert, AlertIcon, AlertTitle, Box, Divider, Flex, Heading, HStack, Stack } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useState } from "react";
import { firestore, useFirestoreDocData } from "reactfire";
import ApplyForm from "~/forms/ApplyForm";
import { delay, useEventData, useOrgData } from "~/helpers/utils";
import firebase from "firebase";

const Event = () => {
    const { ref: orgRef, data: org } = useOrgData();
    const { ref: eventRef, data: event } = useEventData();

    const eventOrgRef = eventRef.collection("orgs").doc(orgRef.id);
    const { data: eventOrg } = useFirestoreDocData(eventOrgRef);

    // Form
    const [formState, setFormState] = useState({ isLoading: false, error: null });
    const handleApply = async ({ applyTeams, expectedStudents, confirmUS }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await eventOrgRef.set({
                applyTeams,
                expectedStudents,
                confirmUS,
                ...(!eventOrg.applyTeams && {
                    startTime: firebase.firestore.FieldValue.serverTimestamp(),
                }),
                updateTime: firebase.firestore.FieldValue.serverTimestamp(),
            });
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    const ends = dayjs.unix(event.stages.apply.ends.seconds);

    return (
        <Stack spacing={6} flexShrink={1} flexBasis={600}>
            <HStack alignItems="flex-end" spacing={6}>
                <Heading size="2xl" flexShrink={0}>
                    {event.name}
                </Heading>
                <Heading size="lg">{org.name}</Heading>
            </HStack>
            <Divider />
            {eventOrg.applyTeams && (
                <Alert status="success">
                    <AlertIcon />
                    You have applied for {eventOrg.applyTeams} teams. Your application will be reviewed by the contest
                    organizers and you will receive an email if you are approved.
                </Alert>
            )}
            <Stack spacing={4}>
                <p>{event.description}</p>
                <p>
                    Before you can add students and assign teams, you must first apply and be approved.
                    {event.maxTeams && <> You may apply for up to {event.maxTeams} teams.</>} You can update your
                    application at any time before the deadline on {ends.format("M/D/YYYY")}.
                </p>
                <p>
                    If you are approved, you will be able to create teams, invite students, and assign students to
                    teams.
                </p>
            </Stack>
            <Flex>
                <Box flexBasis={400}>
                    <ApplyForm
                        onSubmit={handleApply}
                        maxTeams={event.maxTeams}
                        buttonText={eventOrg.applyTeams ? "Update Application" : "Apply"}
                        defaultValues={eventOrg}
                        {...formState}
                    />
                </Box>
            </Flex>
        </Stack>
    );
};

export default Event;
