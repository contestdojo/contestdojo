import { Box, Button, Divider, Heading, Stack } from "@chakra-ui/react";
import dayjs from "dayjs";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useFirestore, useFirestoreCollectionData, useFirestoreDocData } from "reactfire";
import OrgForm from "~/forms/OrgForm";
import { delay, useOrgData } from "~/helpers/utils";

const EventCard = ({ id, name, date: { seconds } }) => {
    const router = useRouter();
    const { orgId } = router.query;
    const date = dayjs.unix(seconds);
    return (
        <Box p={6} maxWidth="sm" borderWidth={1} borderRadius="md">
            <Box as="h4" fontWeight="semibold" isTruncated>
                {name}
            </Box>
            <Box as="h5" color="gray.500">
                {date.format("D/M/YYYY")}
            </Box>
            <NextLink href={`/coach/${orgId}/${id}`} passHref>
                <Button as="a" mt={2} colorScheme="blue" size="sm">
                    Register
                </Button>
            </NextLink>
        </Box>
    );
};

const Organization = () => {
    const firestore = useFirestore();

    // Get org
    const { ref: orgRef, data: org } = useOrgData();

    // Get events
    const eventsRef = firestore.collection("events");
    const { data: events } = useFirestoreCollectionData(eventsRef, { idField: "id" });

    // Form
    const [formState, setFormState] = useState({ isLoading: false, error: null });
    const handleUpdate = async ({ name, address, city, state, country, zip }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await orgRef.update({
                name,
                address,
                city,
                state,
                country,
                zip,
            });
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    return (
        <Stack spacing={6} m={6} flexShrink={1} flexBasis={600}>
            <Heading size="2xl">{org.name}</Heading>
            <Divider />

            <Heading size="lg">Event Registration</Heading>
            {events.map(x => (
                <EventCard key={x.id} {...x} />
            ))}
            <Divider />

            <Heading size="lg">Organization Details</Heading>
            <OrgForm
                key={org.id}
                onSubmit={handleUpdate}
                buttonText="Update Organization"
                defaultValues={org}
                {...formState}
            />
        </Stack>
    );
};

export default Organization;
