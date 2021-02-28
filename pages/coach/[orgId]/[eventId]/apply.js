import { Alert, AlertIcon, Box, Divider, Flex, Heading, HStack, Stack } from "@chakra-ui/react";
import dayjs from "dayjs";
import firebase from "firebase";
import { useState } from "react";
import { useFirestoreDocData } from "reactfire";
import ApplyForm from "~/forms/ApplyForm";
import { delay, useEventData, useOrgData } from "~/helpers/utils";

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
            await eventOrgRef.set(
                {
                    applyTeams,
                    expectedStudents,
                    confirmUS,
                    ...(!eventOrg.applyTeams && {
                        startTime: firebase.firestore.FieldValue.serverTimestamp(),
                    }),
                    updateTime: firebase.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
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
                <Heading size="lg" flex={1}>
                    {org.name}
                </Heading>
            </HStack>
            <Divider />
            {eventOrg.applyTeams && (
                <Alert status="success">
                    <AlertIcon />
                    You have applied for {eventOrg.applyTeams} teams. Your application will be reviewed by the contest
                    organizers and you will receive an email once you are approved.
                </Alert>
            )}
            <Stack spacing={4}>
                <p>
                    Stanford Math Tournament (SMT) 2021 will be taking place virtually on Saturday, April 17, 2021,
                    tentatively from 8am – 5pm PT! SMT is an annual student-run math competition for high school
                    students that aims to encourage interest in math by providing students with the opportunity to work
                    on fun and challenging problems. For more information about our tournament please visit our website:
                    <a href="http://sumo.stanford.edu/smt">http://sumo.stanford.edu/smt</a>.
                </p>
                <p>
                    Our tournament is open to any organization located in the U.S. and any high school student (age 14
                    and older) currently located in the US. Due to capacity constraints, registration will be done on an
                    application basis. You will simply apply for the number of teams (up to eight students each) you’d
                    like and may update your application at any time before the registration deadline at 11:59pm PT on
                    March 19. If you are accepted into the tournament, you will be able to create teams, invite
                    students, and assign students to teams.
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
