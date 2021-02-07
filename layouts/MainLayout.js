import { Box, Button, Divider, Flex, Heading, Link, Spacer, Spinner, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { AuthCheck, useAuth, useFirestore, useFirestoreCollectionData } from "reactfire";
import { useUserRef } from "~/helpers/utils";

const Navigation = () => {
    const auth = useAuth();

    const firestore = useFirestore();
    const userRef = useUserRef();
    const orgsRef = firestore.collection("orgs").where("admin", "==", userRef);
    const { data: orgs } = useFirestoreCollectionData(orgsRef, { idField: "id" });

    return (
        <VStack flexBasis={300} boxShadow="0 0 10px rgba(0, 0, 0, 0.1)" spacing={0} divider={<Divider />}>
            <Box padding={6}>
                <Heading textAlign="center">Name</Heading>
            </Box>

            <VStack spacing={6} paddingY={6}>
                <Heading size={3}>Organizations</Heading>

                {orgs.map(x => (
                    <NextLink href={`/orgs/${x.id}`} key={x.id}>
                        <Link>{x.name}</Link>
                    </NextLink>
                ))}
                <NextLink href={`/orgs/new`} passHref>
                    <Button as="a" colorScheme="blue">
                        New Organization
                    </Button>
                </NextLink>

                <Spacer />

                <Button onClick={() => auth.signOut()}>Sign Out</Button>

                <Text>TODO: Make the sidebar look good</Text>
            </VStack>
        </VStack>
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

const AuthWrapper = ({ children }) => {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        auth.onAuthStateChanged(user => {
            if (!user) {
                router.replace("/login");
            }
        });
    }, []);

    return <AuthCheck fallback={<Spinner />}>{children}</AuthCheck>;
};

const MainLayout = ({ children }) => (
    <AuthWrapper>
        <ContentWrapper>{children}</ContentWrapper>
    </AuthWrapper>
);

export default MainLayout;
