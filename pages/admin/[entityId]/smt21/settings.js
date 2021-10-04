import { Button } from "@chakra-ui/button";
import { Heading, HStack, Stack, Text } from "@chakra-ui/layout";
import { Switch } from "@chakra-ui/switch";
import { useFunctions } from "reactfire";
import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";
import EventForm from "~/components/forms/EventForm";
import { useFormState } from "~/helpers/utils";

const EventDetails = () => {
    const { ref: eventRef, data: event } = useEvent();

    const [formState, wrapAction] = useFormState();

    const handleCheck = async e => {
        await eventRef.update({ frozen: e.target.checked });
    };

    const handleSubmit = wrapAction(async ({ name }) => {
        await eventRef.update({ name });
    });

    // Roster

    const functions = useFunctions();
    const updateStudentNumbers = functions.httpsCallable("updateStudentNumbers");

    return (
        <>
            <Card as={Stack} spacing={4} p={4} maxWidth="md">
                <Heading size="md">Roster</Heading>
                <HStack>
                    <Switch isChecked={event.frozen} onChange={handleCheck} />
                    <Text>Freeze roster changes</Text>
                </HStack>
                <Button onClick={() => updateStudentNumbers({ eventId: eventRef.id })} alignSelf="flex-start">
                    Assign/reassign Numbers
                </Button>
            </Card>
            <Card as={Stack} spacing={4} p={4} maxWidth="md">
                <Heading size="md">Event Details</Heading>
                <EventForm
                    key={event.id}
                    onSubmit={handleSubmit}
                    buttonText="Update Event"
                    defaultValues={event}
                    {...formState}
                />
            </Card>
        </>
    );
};

export default EventDetails;
