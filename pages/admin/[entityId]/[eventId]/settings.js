import { Box } from "@chakra-ui/layout";
import { useState } from "react";
import { useEvent } from "~/contexts/EventProvider";
import EventForm from "~/forms/EventForm";
import { delay } from "~/helpers/utils";

const EventDetails = () => {
    const { ref: eventRef, data: event } = useEvent();

    const [formState, setFormState] = useState({ isLoading: false, error: null });
    const handleUpdate = async ({ name }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await eventRef.update({ name });
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

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
