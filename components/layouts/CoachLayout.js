import { Heading, Link, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import AuthWrapper from "~/components/AuthWrapper";
import { useUserRef } from "~/helpers/utils";
import MainLayout from "./MainLayout";

const Sidebar = () => {
    const { query } = useRouter();

    const firestore = useFirestore();
    const userRef = useUserRef();
    const orgsRef = firestore.collection("orgs").where("admin", "==", userRef);
    const { data: orgs } = useFirestoreCollectionData(orgsRef, { idField: "id" });

    const activeStyle = { backgroundColor: "gray.100" };

    return (
        <Stack spacing={3}>
            <Heading size={3}>Organizations</Heading>
            <Stack spacing={1} style={{ marginLeft: "-0.75rem", marginRight: "-0.75rem" }}>
                {orgs.map(x => (
                    <NextLink href={`/coach/${x.id}`} key={x.id}>
                        <Link
                            {...(x.id == query.orgId && activeStyle)}
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
    );
};

const CoachLayout = ({ children }) => (
    <AuthWrapper type="coach">
        <MainLayout sidebar={<Sidebar />}>{children}</MainLayout>
    </AuthWrapper>
);

export default CoachLayout;
