import { Box, Button, Divider, Flex, Heading, Link, Spacer, Stack } from "@chakra-ui/react";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useAuth, useFirestore, useFirestoreCollection, useFirestoreCollectionData } from "reactfire";
import AuthWrapper from "~/components/AuthWrapper";
import { useUserRef } from "~/helpers/utils";
import firebase from "firebase";
import { StickyContainer } from "react-sticky";

const Navigation = () => {
    const auth = useAuth();
    const { query } = useRouter();

    const firestore = useFirestore();
    const userRef = useUserRef();

    const studentsQuery = firestore.collectionGroup("students").where("user", "==", userRef);
    const students = useFirestoreCollection(studentsQuery, { idField: "id" }).data.docs;
    const studentEventIds = students.map(x => x.ref.parent.parent.id);

    const eventsQuery = firestore
        .collection("events")
        .where(firebase.firestore.FieldPath.documentId(), "in", studentEventIds);
    const { data: events } = useFirestoreCollectionData(eventsQuery, { idField: "id" });

    const activeStyle = { backgroundColor: "gray.100" };

    return (
        <Stack flexBasis={300} boxShadow="0 0 10px rgba(0, 0, 0, 0.1)" spacing={0} divider={<Divider />}>
            <Box padding={6}>
                <NextLink href="/student">
                    <a>
                        <Image src="/smt.png" width={684} height={216} />
                    </a>
                </NextLink>
            </Box>

            <Stack spacing={6} p={8} flex={1}>
                <Stack spacing={3}>
                    <Heading size={3}>Events</Heading>
                    <Stack spacing={1} style={{ marginLeft: "-0.75rem", marginRight: "-0.75rem" }}>
                        {events.map(x => (
                            <NextLink href={`/student/${x.id}`} key={x.id}>
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
        <Box as={StickyContainer} flex={1} padding={12} overflow="scroll">
            <Flex justifyContent="center">{children}</Flex>
        </Box>
    </Flex>
);

const StudentLayout = ({ children }) => (
    <AuthWrapper type="student">
        <ContentWrapper>{children}</ContentWrapper>
    </AuthWrapper>
);

export default StudentLayout;
