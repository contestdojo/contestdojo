import { Box, Button, Divider, Flex, Spacer, Stack, Text } from "@chakra-ui/react";
import Image from "next/image";
import NextLink from "next/link";
import { StickyContainer } from "react-sticky";
import { useAuth } from "reactfire";

const Navigation = ({ sidebar }) => {
    const auth = useAuth();

    return (
        <Stack flexBasis={300} boxShadow="0 0 10px rgba(0, 0, 0, 0.1)" spacing={0} divider={<Divider />}>
            <Box padding={6} mx="auto">
                <NextLink href="/">
                    <a>
                        <Image src="/logo.svg" width={100} height={100} />
                    </a>
                </NextLink>
            </Box>

            <Stack spacing={6} p={8} flex={1}>
                {sidebar}
                <Spacer />
                <Button onClick={() => auth.signOut()}>Sign Out</Button>
            </Stack>
        </Stack>
    );
};

const MainLayout = ({ sidebar, children }) => (
    <Stack height="100vh" spacing={0}>
        <Flex flex={1}>
            <Navigation sidebar={sidebar} />
            <Box as={StickyContainer} flex={1} padding={12} overflow="scroll">
                {children}
            </Box>
        </Flex>
        <Box backgroundColor="gray.200">
            <Text align="center">test</Text>
        </Box>
    </Stack>
);

export default MainLayout;
