import { Box } from "@chakra-ui/layout";
import { useEvent } from "~/contexts/EventProvider";
import EventForm from "~/forms/EventForm";
import { useFormState } from "../../../../helpers/utils";

const EventDetails = () => {
    const { ref: eventRef, data: event } = useEvent();

    const [formState, wrapAction] = useFormState();
    const handleUpdate = wrapAction(async ({ name }) => {
        await eventRef.update({ name });
    });

    return (
        <Box maxWidth={600}>
            <EventForm
                key={event.id}
                onSubmit={handleUpdate}
                buttonText="Update Event"
                defaultValues={event}
                {...formState}
            />
        </Box>
    );
};

export default EventDetails;
