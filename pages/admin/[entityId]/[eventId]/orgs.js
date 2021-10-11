/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { useFirestore, useFirestoreCollectionData } from "reactfire";
import AdminTableView, { updateRenderer } from "~/components/AdminTableView";
import { useEvent } from "~/components/contexts/EventProvider";
import { toDict } from "~/helpers/utils";

const OrgsTable = ({ event, orgs, onUpdate }) => {
    const cols = [
        { label: "ID", key: "id", hideByDefault: true },
        { label: "Name", key: "name", renderer: updateRenderer(onUpdate, "name") },
        { label: "Address", key: "address", hideByDefault: true },
        { label: "Contact", key: "admin" },
        { label: "Contact Email", key: "adminEmail" },
        { label: "Notes", key: "notes", renderer: updateRenderer(onUpdate, "notes") },
    ];

    const rows = orgs.map(x => ({
        id: x.id,
        name: x.name,
        address: `${x.address}, ${x.city}, ${x.state}, ${x.country} ${x.zip}`,
        admin: `${x.adminData?.fname} ${x.adminData?.lname}`,
        adminEmail: x.adminData?.email,
        notes: x.notes ?? "",
    }));

    return <AdminTableView cols={cols} rows={rows} defaultSortKey="name" filename="organizations.csv" />;
};

const OrgsTab = () => {
    const firestore = useFirestore();
    const { ref: eventRef, data: event } = useEvent();

    const eventOrgsRef = eventRef.collection("orgs");
    const { data: eventOrgs } = useFirestoreCollectionData(eventOrgsRef, { idField: "id" });
    let orgsById = eventOrgs.reduce(toDict, {});

    const rootOrgsRef = firestore.collection("orgs");
    const { data: rootOrgs } = useFirestoreCollectionData(rootOrgsRef, { idField: "id" });
    orgsById = rootOrgs.filter(x => orgsById.hasOwnProperty(x.id)).reduce(toDict, orgsById);

    const handleOrgUpdate = async (id, update) => {
        await eventOrgsRef.doc(id).update(update);
    };

    return <OrgsTable event={event} orgs={Object.values(orgsById)} onUpdate={handleOrgUpdate} />;
};

export default OrgsTab;
