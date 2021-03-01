import { Box, Button, Divider, Flex, Heading, Link, Spacer, Stack } from "@chakra-ui/react";
import Image from "next/image";
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
    const orgsRef = firestore.collection("orgs").where("admin", "==", userRef);
    const { data: orgs } = useFirestoreCollectionData(orgsRef, { idField: "id" });

    const activeStyle = { backgroundColor: "gray.100" };

    return (
        <Stack flexBasis={300} boxShadow="0 0 10px rgba(0, 0, 0, 0.1)" spacing={0} divider={<Divider />}>
            <Box padding={6}>
                <Image src="/smt.png" width={684} height={216} />
            </Box>

            <Stack spacing={6} p={8} flex={1}>
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

                <NextLink href={`/coach/new`} passHref>
                    <Button as="a" colorScheme="blue">
                        New Organization
                    </Button>
                </NextLink>

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

const CoachLayout = ({ children }) => (
    <AuthWrapper type="coach">
        <ContentWrapper>{children}</ContentWrapper>
    </AuthWrapper>
);

export default CoachLayout;
