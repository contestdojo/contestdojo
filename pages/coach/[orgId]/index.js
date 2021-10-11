/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Box, Divider, Heading, Stack } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import OrgProvider, { useOrg } from "~/components/contexts/OrgProvider";
import OrgForm from "~/components/forms/OrgForm";
import { useFormState } from "~/helpers/utils";

const EventCard = ({ id, name, date: { seconds } }) => {
    const router = useRouter();
    const { orgId } = router.query;
    const date = dayjs.unix(seconds);
    return (
        <Card p={6} maxWidth="sm">
            <Box as="h4" fontWeight="semibold" isTruncated>
                {name}
            </Box>
            <Box as="h5" color="gray.500">
                {date.format("M/D/YYYY")}
            </Box>
            <ButtonLink href={`/coach/${orgId}/${id}`} mt={2} colorScheme="blue" size="sm">
                Register
            </ButtonLink>
        </Card>
    );
};

const OrganizationContent = () => {
    const firestore = useFirestore();

    // Get org
    const { ref: orgRef, data: org } = useOrg();

    // Get events
    const eventsRef = firestore.collection("events");
    let { data: events } = useFirestoreCollectionData(eventsRef, { idField: "id" });

    events = events.filter(x => !x.hide);

    // Form
    const [formState, wrapAction] = useFormState();
    const handleUpdate = wrapAction(async ({ name, address, city, state, country, zip }) => {
        await orgRef.update({
            name,
            address,
            city,
            state,
            country,
            zip,
        });
    });

    return (
        <Stack spacing={6} maxW={600} mx="auto">
            <Heading size="2xl">{org.name}</Heading>
            <Divider />

            <Heading size="lg">Event Registration</Heading>
            {events.map(x => (
                <EventCard key={x.id} {...x} />
            ))}
            {events.length == 0 && <p>No events to register for at this time.</p>}
            <Divider />

            <Heading size="lg">Organization Details</Heading>
            <OrgForm
                key={orgRef.id}
                onSubmit={handleUpdate}
                buttonText="Update Organization"
                defaultValues={org}
                {...formState}
            />
        </Stack>
    );
};

const Organization = () => (
    <OrgProvider>
        <OrganizationContent />
    </OrgProvider>
);

export default Organization;
