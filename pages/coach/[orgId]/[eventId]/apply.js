import { Alert, AlertIcon, Box, Button, Divider, Flex, Heading, HStack, Link, Stack } from "@chakra-ui/react";
import firebase from "firebase";
import { useState } from "react";
import { useFirestoreDocData } from "reactfire";
import EventProvider, { useEvent } from "~/contexts/EventProvider";
import OrgProvider, { useOrg } from "~/contexts/OrgProvider";
import ApplyForm from "~/forms/ApplyForm";
import { delay } from "~/helpers/utils";

const ApplyContent = () => {
    const { ref: orgRef, data: org } = useOrg();
    const { ref: eventRef, data: event } = useEvent();

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
    const handleWithdraw = async () => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await eventOrgRef.delete();
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    return (
        <Stack spacing={6} flexBasis={600}>
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
                    on fun and challenging problems. For more information about our tournament please visit our website
                    at{" "}
                    <Link color="blue.500" href="http://sumo.stanford.edu/smt">
                        http://sumo.stanford.edu/smt
                    </Link>
                    .
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
                <Stack flexBasis={400} spacing={4}>
                    <ApplyForm
                        onSubmit={handleApply}
                        maxTeams={event.maxTeams}
                        buttonText={eventOrg.applyTeams ? "Update Application" : "Apply"}
                        defaultValues={eventOrg}
                        {...formState}
                    />
                    {eventOrg.applyTeams && (
                        <Button
                            colorScheme="red"
                            type="button"
                            isLoading={formState.isLoading}
                            onClick={handleWithdraw}
                        >
                            Withdraw Application
                        </Button>
                    )}
                </Stack>
            </Flex>
        </Stack>
    );
};

const Apply = () => (
    <OrgProvider>
        <EventProvider>
            <ApplyContent />
        </EventProvider>
    </OrgProvider>
);

export default Apply;
