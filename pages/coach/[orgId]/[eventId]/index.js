import { useRouter } from "next/router";
import EventProvider from "~/components/contexts/EventProvider";
import OrgProvider from "~/components/contexts/OrgProvider";

const EventContent = () => {
    const router = useRouter();
    const { orgId, eventId } = router.query;
    router.replace(`/coach/${orgId}/${eventId}/teams`);

    return null;
};

const Event = () => (
    <OrgProvider>
        <EventProvider>
            <EventContent />
        </EventProvider>
    </OrgProvider>
);

export default Event;
