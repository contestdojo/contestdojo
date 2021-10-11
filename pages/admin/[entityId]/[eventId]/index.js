/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { useRouter } from "next/router";

const Event = () => {
    const router = useRouter();
    const { entityId, eventId } = router.query;
    router.replace(`/admin/${entityId}/${eventId}/orgs`);

    return null;
};

export default Event;
