import { useRouter } from "next/router";

const Event = () => {
    const router = useRouter();
    const { entityId } = router.query;
    router.replace(`/admin/${entityId}/smt21/orgs`);

    return null;
};

export default Event;
