import { Center } from "@chakra-ui/react";

const EmptyLayout = ({ children }) => (
    <Center minH="100vh" p={8}>
        {children}
    </Center>
);

export default EmptyLayout;
