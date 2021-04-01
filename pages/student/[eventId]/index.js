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

    const { data: org } = useFirestoreDocData(student.org);
    const { data: team } = useFirestoreDocData(student.team ?? eventRef.collection("teams").doc("none"));

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
                <Alert status="info">
                    <AlertIcon />A waiver form has been requested for {student.parentEmail}. It may take up to two days
                    for the form to be sent. This page will be updated when the waiver is complete.
                </Alert>
            )}
            <p>
                {student.team ? (
                    <>
                        Your coach at <b>{org.name}</b> has assigned you to Team <b>{team.name}</b> in the{" "}
                        <b>{team.division == 0 ? "Tree" : "Sapling"} division</b>.{" "}
                    </>
                ) : (
                    "Your coach has registered you for the Stanford Math Tournament, but you have yet to be assigned a team. "
                )}
                We require waivers to be completed before you are permitted to compete at SMT 2021. Please input your
                parent’s email address by Friday, April 9th. The waiver will be sent directly to your parent’s email for
                them to complete. Please allow up to two days for waivers to be sent.
            </p>
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
