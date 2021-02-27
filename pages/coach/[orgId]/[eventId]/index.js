import { useRouter } from "next/router";
import { useEventData } from "~/helpers/utils";

const Event = () => {
    const { data: event } = useEventData();

    const router = useRouter();
    const { orgId, eventId } = router.query;
    router.replace(`/coach/${orgId}/${eventId}/${event.stage ?? "teams"}`);

    return null;
};

export default Event;
