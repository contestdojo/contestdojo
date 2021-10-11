/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

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
