import { Box, Button, Divider, Flex, Heading, Link, Spacer, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useAuth, useFirestore, useFirestoreCollectionData } from "reactfire";
import AuthWrapper from "~/components/AuthWrapper";
import { useUserRef } from "~/helpers/utils";

const Navigation = () => {
    const auth = useAuth();
    const { query } = useRouter();

    const firestore = useFirestore();
    const userRef = useUserRef();

    // Get entities
    const entitiesRef = firestore.collection("entities").where("admins", "array-contains", userRef);
    const { data: entities } = useFirestoreCollectionData(entitiesRef, { idField: "id" });
    const entityRefs = entities.map(x => firestore.collection("entities").doc(x.id));

    // Get events
    const eventsRef = firestore.collection("events").where("owner", "in", [...entityRefs, "0"]);
    const { data: events } = useFirestoreCollectionData(eventsRef, { idField: "id" });

    const activeStyle = {
        backgroundColor: "gray.100",
    };

    return (
        <Stack flexBasis={300} boxShadow="0 0 10px rgba(0, 0, 0, 0.1)" spacing={0} divider={<Divider />}>
            <Box padding={6}>
                <Heading textAlign="center">Admin</Heading>
            </Box>

            <Stack spacing={6} p={8} flex={1}>
                <Stack spacing={3}>
                    <Heading size={3}>Organizing Entities</Heading>
                    <Stack spacing={1} style={{ marginLeft: "-0.75rem", marginRight: "-0.75rem" }}>
                        {entities.map(x => (
                            <NextLink href={`/admin/${x.id}`} key={x.id}>
                                <Link
                                    {...(x.id == query.entityId && !query.eventId && activeStyle)}
                                    _hover={activeStyle}
                                    borderRadius={4}
                                    px={3}
                                    py={2}
                                >
                                    {x.name}
                                </Link>
                            </NextLink>
                        ))}
                    </Stack>
                </Stack>

                <Stack spacing={3}>
                    <Heading size={3}>Events</Heading>
                    <Stack spacing={1} style={{ marginLeft: "-0.75rem", marginRight: "-0.75rem" }}>
                        {events.map(x => (
                            <NextLink href={`/admin/${x.owner.id}/${x.id}`} key={x.id}>
                                <Link
                                    {...(x.id == query.eventId && activeStyle)}
                                    _hover={activeStyle}
                                    borderRadius={4}
                                    px={3}
                                    py={2}
                                >
                                    {x.name}
                                </Link>
                            </NextLink>
                        ))}
                    </Stack>
                </Stack>

                <Spacer />

                <Button onClick={() => auth.signOut()}>Sign Out</Button>
            </Stack>
        </Stack>
    );
};

const ContentWrapper = ({ children }) => (
    <Flex height="100vh">
        <Navigation />
        <Box flex={1} padding={12} overflow="scroll">
            <Flex justifyContent="center">{children}</Flex>
        </Box>
    </Flex>
);

const AdminLayout = ({ children }) => (
    <AuthWrapper type="admin">
        <ContentWrapper>{children}</ContentWrapper>
    </AuthWrapper>
);

export default AdminLayout;
