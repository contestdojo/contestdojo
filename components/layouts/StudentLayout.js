import { Heading, HStack, Link, Stack, Tag, Text } from "@chakra-ui/react";
import firebase from "firebase";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useFirestore, useFirestoreCollection, useFirestoreCollectionData } from "reactfire";
import AuthWrapper from "~/components/AuthWrapper";
import { useUserRef } from "~/helpers/utils";
import MainLayout from "./MainLayout";

const Sidebar = () => {
    const firestore = useFirestore();
    const userRef = useUserRef();
    const { query } = useRouter();

    const studentsQuery = firestore.collectionGroup("students").where("user", "==", userRef);
    const students = useFirestoreCollection(studentsQuery, { idField: "id" }).data.docs;
    const studentEventIds = students.map(x => x.ref.parent.parent.id);

    const eventsQuery = firestore
        .collection("events")
        .where(firebase.firestore.FieldPath.documentId(), "in", studentEventIds);
    const { data: events } = useFirestoreCollectionData(eventsQuery, { idField: "id" });

    const activeStyle = { backgroundColor: "gray.100" };

    return (
        <Stack spacing={3}>
            <Heading size={3}>Events</Heading>
            <Stack spacing={1} style={{ marginLeft: "-0.75rem", marginRight: "-0.75rem" }}>
                {events.map(x => {
                    let number = students.find(s => s.ref.parent.parent.id === x.id)?.data()?.number;
                    return (
                        <NextLink href={`/student/${x.id}`} key={x.id}>
                            <Link
                                {...(x.id == query.eventId && activeStyle)}
                                _hover={activeStyle}
                                borderRadius={4}
                                px={3}
                                py={2}
                            >
                                <HStack>
                                    <Text>{x.name}</Text>
                                    {number && (
                                        <Tag colorScheme="blue" size="sm">
                                            {number}
                                        </Tag>
                                    )}
                                </HStack>
                            </Link>
                        </NextLink>
                    );
                })}
            </Stack>
        </Stack>
    );
};

const StudentLayout = ({ children }) => (
    <AuthWrapper type="student">
        <MainLayout sidebar={<Sidebar />}>{children}</MainLayout>
    </AuthWrapper>
);

export default StudentLayout;
