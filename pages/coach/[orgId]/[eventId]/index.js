import { useRouter } from "next/router";
import { useFirestoreDocData } from "reactfire";
import EventProvider, { useEvent } from "~/components/contexts/EventProvider";
import OrgProvider, { useOrg } from "~/components/contexts/OrgProvider";

const EventContent = () => {
    const { ref: orgRef, data: org } = useOrg();
    const { ref: eventRef, data: event } = useEvent();

    // Get students
    const eventOrgRef = eventRef.collection("orgs").doc(orgRef.id);
    const { data: eventOrg } = useFirestoreDocData(eventOrgRef);

    const router = useRouter();
    const { orgId, eventId } = router.query;
    router.replace(`/coach/${orgId}/${eventId}/${eventOrg.stage ?? event.defaultStage}`);

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
