import { Alert, AlertIcon, AlertTitle, Box, Divider, Flex, Heading, HStack, Stack } from "@chakra-ui/react";
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
    const handleApply = async ({ applyTeams }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await eventOrgRef.set({ applyTeams }, { merge: true });
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    console.log(eventOrg);

    return (
        <Stack spacing={6} flex={1}>
            <HStack alignItems="flex-end" spacing={6}>
                <Heading size="2xl">{event.name}</Heading>
                <Heading size="lg">{org.name}</Heading>
            </HStack>
            <Divider />
            <p>
                Before you can add students and assign teams, you must first apply and be approved. You may apply for up
                to {event.maxTeams} teams.
            </p>
            <Flex>
                <Stack spacing={4} flexShrink={1} flexBasis={600}>
                    {eventOrg.applyTeams && (
                        <Alert status="info">
                            <AlertIcon />
                            You have applied for {eventOrg.applyTeams} teams. Your application will be reviewed by the
                            contest organizers and you will receive an email if you are approved.
                        </Alert>
                    )}
                    <ApplyForm
                        onSubmit={handleApply}
                        maxTeams={event.maxTeams}
                        buttonText={eventOrg.applyTeams ? "Edit Application" : "Apply"}
                        defaultValues={eventOrg}
                        {...formState}
                    />
                </Stack>
            </Flex>
        </Stack>
    );
};

export default Event;
