import { Alert, AlertIcon, Divider, Heading, HStack, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { useFirestoreDocData, useUser } from "reactfire";
import EventProvider, { useEvent } from "~/contexts/EventProvider";
import ParentEmailForm from "~/forms/ParentEmailForm";
import { delay } from "~/helpers/utils";

const EventContent = () => {
    const { ref: eventRef, data: event } = useEvent();
    const { data: user } = useUser();

    const studentRef = eventRef.collection("students").doc(user.uid);
    const { data: student } = useFirestoreDocData(studentRef);

    // Form
    const [formState, setFormState] = useState({ isLoading: false, error: null });
    const handleSubmit = async ({ parentEmail }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await studentRef.set({ parentEmail }, { merge: true });
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    return (
        <Stack spacing={6} flexBasis={600}>
            <HStack alignItems="flex-end" spacing={6}>
                <Heading>{event.name}</Heading>
            </HStack>
            <Divider />
            {student.parentEmail && (
                <Alert status="success">
                    <AlertIcon />A waiver form has been requested for {student.parentEmail}. It may take up to 2 days
                    for the form to be sent.
                </Alert>
            )}
            <ParentEmailForm
                onSubmit={handleSubmit}
                buttonText={student.parentEmail ? "Update Parent Email" : "Request Waiver"}
                defaultValues={student}
                {...formState}
            />
        </Stack>
    );
};

const Event = () => (
    <EventProvider>
        <EventContent />
    </EventProvider>
);

export default Event;
