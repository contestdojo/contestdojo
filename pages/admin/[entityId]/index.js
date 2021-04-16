import { Box, Button, Divider, Heading, Stack } from "@chakra-ui/react";
import dayjs from "dayjs";
import NextLink from "next/link";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import EntityProvider, { useEntity } from "~/components/contexts/EntityProvider";
import EntityForm from "~/components/forms/EntityForm";
import { useFormState } from "~/helpers/utils";

const EventCard = ({ id, name, owner, date: { seconds } }) => {
    const date = dayjs.unix(seconds);
    return (
        <Card p={6} maxWidth="sm">
            <Box as="h4" fontWeight="semibold" isTruncated>
                {name}
            </Box>
            <Box as="h5" color="gray.500">
                {date.format("M/D/YYYY")}
            </Box>
            <ButtonLink href={`/admin/${owner.id}/${id}`} mt={2} colorScheme="blue" size="sm">
                Manage
            </ButtonLink>
        </Card>
    );
};

const EntityContent = () => {
    const firestore = useFirestore();

    // Get org
    const { ref: entityRef, data: entity } = useEntity();

    // Get events
    const eventsRef = firestore.collection("events").where("owner", "==", entityRef);
    const { data: events } = useFirestoreCollectionData(eventsRef, { idField: "id" });

    // Form
    const [formState, wrapAction] = useFormState();
    const handleUpdate = wrapAction(async ({ name }) => {
        await entityRef.update({ name });
    });

    return (
        <Stack spacing={6} flexBasis={600}>
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

const Entity = () => (
    <EntityProvider>
        <EntityContent />
    </EntityProvider>
);

export default Entity;
