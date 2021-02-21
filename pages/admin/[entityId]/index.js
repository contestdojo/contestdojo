import { Box, Button, Divider, Heading, Stack } from "@chakra-ui/react";
import dayjs from "dayjs";
import NextLink from "next/link";
import { useState } from "react";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import EntityForm from "~/forms/EntityForm";
import { delay, useEntityData } from "~/helpers/utils";

const EventCard = ({ id, name, owner, date: { seconds } }) => {
    const date = dayjs.unix(seconds);
    return (
        <Box p={6} maxWidth="sm" borderWidth={1} borderRadius="md">
            <Box as="h4" fontWeight="semibold" isTruncated>
                {name}
            </Box>
            <Box as="h5" color="gray.500">
                {date.format("D/M/YYYY")}
            </Box>
            <NextLink href={`/admin/${owner.id}/${id}`} passHref>
                <Button as="a" mt={2} colorScheme="blue" size="sm">
                    Manage
                </Button>
            </NextLink>
        </Box>
    );
};

const Entity = () => {
    const firestore = useFirestore();

    // Get org
    const { ref: entityRef, data: entity } = useEntityData();

    // Get events
    const eventsRef = firestore.collection("events").where("owner", "==", entityRef);
    const { data: events } = useFirestoreCollectionData(eventsRef, { idField: "id" });

    // Form
    const [formState, setFormState] = useState({ isLoading: false, error: null });
    const handleUpdate = async ({ name }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await entityRef.update({
                name,
            });
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    return (
        <Stack spacing={6} m={6} flexShrink={1} flexBasis={600}>
            <Heading size="2xl">{entity.name}</Heading>
            <Divider />

            <Heading size="lg">Events</Heading>
            {events.map(x => (
                <EventCard key={x.id} {...x} />
            ))}
            <Divider />

            <Heading size="lg">Entity Details</Heading>
            <EntityForm
                key={entity.id}
                onSubmit={handleUpdate}
                buttonText="Update Entity"
                defaultValues={entity}
                {...formState}
            />
        </Stack>
    );
};

export default Entity;
