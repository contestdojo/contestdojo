import { useRouter } from "next/router";
import EventProvider, { useEvent } from "~/contexts/EventProvider";

const EventContent = () => {
    const { data: event } = useEvent();

    const router = useRouter();
    const { orgId, eventId } = router.query;
    router.replace(`/coach/${orgId}/${eventId}/${event.stage ?? "teams"}`);

    return null;
};

const Event = () => (
    <EventProvider>
        <EventContent />
    </EventProvider>
);

export default Event;
