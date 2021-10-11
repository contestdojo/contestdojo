import { Box, Button, Divider, Flex, Spacer, Stack, Text } from "@chakra-ui/react";
import Image from "next/image";
import NextLink from "next/link";
import { StickyContainer } from "react-sticky";
import { useAuth } from "reactfire";

const Navigation = ({ sidebar }) => {
    const auth = useAuth();

    return (
        <Stack flexBasis={300} shadow="md" spacing={0} divider={<Divider />}>
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

            <Text py={2} align="center" color="gray.500" fontSize="sm">
                &copy; 2021 Oliver Ni
            </Text>
        </Stack>
    );
};

const MainLayout = ({ sidebar, children }) => (
    <Flex height="100vh">
        <Navigation sidebar={sidebar} />
        <Box as={StickyContainer} flex={1} padding={12} overflow="scroll">
            {children}
        </Box>
    </Flex>
);

export default MainLayout;
