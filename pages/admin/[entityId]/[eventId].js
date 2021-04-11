import { useRouter } from "next/router";

const Event = () => {
    const router = useRouter();
    const { entityId, eventId } = router.query;
    router.replace(`/admin/${entityId}/${eventId}/orgs`);

    return null;
};

export default Event;
