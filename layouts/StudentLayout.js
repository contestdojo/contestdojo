import { Box, Button, Divider, Flex, Heading, Spacer, VStack } from "@chakra-ui/react";
import { useAuth } from "reactfire";
import AuthWrapper from "~/components/AuthWrapper";

const Navigation = () => {
    const auth = useAuth();

    return (
        <VStack flexBasis={300} boxShadow="0 0 10px rgba(0, 0, 0, 0.1)" spacing={0} divider={<Divider />}>
            <Box padding={6}>
                <Heading textAlign="center">Student</Heading>
            </Box>

            <VStack spacing={6} pt={6} flex={1}>
                <Heading size={3}>YOU ARE A STUDENT</Heading>

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
    <AuthWrapper type="student">
        <ContentWrapper>{children}</ContentWrapper>
    </AuthWrapper>
);

export default CoachLayout;
