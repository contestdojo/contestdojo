import { Box, Button, Divider, Flex, Heading, Link, Spacer, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useAuth, useFirestore, useFirestoreCollectionData } from "reactfire";
import AuthWrapper from "~/components/AuthWrapper";
import { useUserData } from "~/helpers/utils";

const Navigation = () => {
    const auth = useAuth();

    const router = useRouter();
    const firestore = useFirestore();
    const { ref: userRef, data: userData } = useUserData();
    const orgsRef = firestore.collection("orgs").where("admin", "==", userRef);
    const { data: orgs } = useFirestoreCollectionData(orgsRef, { idField: "id" });

    if (userData.type !== "coach") {
        router.replace("/");
    }

    return (
        <VStack flexBasis={300} boxShadow="0 0 10px rgba(0, 0, 0, 0.1)" spacing={0} divider={<Divider />}>
            <Box padding={6}>
                <Heading textAlign="center">Coach</Heading>
            </Box>

            <VStack spacing={6} pt={6} pb={12} flex={1}>
                <Heading size={3}>Organizations</Heading>

                {orgs.map(x => (
                    <NextLink href={`/coach/orgs/${x.id}`} key={x.id}>
                        <Link>{x.name}</Link>
                    </NextLink>
                ))}
                <NextLink href={`/coach/orgs/new`} passHref>
                    <Button as="a" colorScheme="blue">
                        New Organization
                    </Button>
                </NextLink>

                <Spacer />

                <Button onClick={() => auth.signOut()}>Sign Out</Button>
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

const CoachLayout = ({ children }) => (
    <AuthWrapper type="coach">
        <ContentWrapper>{children}</ContentWrapper>
    </AuthWrapper>
);

export default CoachLayout;
