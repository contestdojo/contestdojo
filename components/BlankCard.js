const { Flex, Text } = require("@chakra-ui/layout");

const BlankCard = ({ children, ...props }) => {
    return (
        <Flex
            m={2}
            p={4}
            borderWidth={1}
            flex={1}
            justifyContent="center"
            alignItems="center"
            borderStyle="dashed"
            borderRadius="md"
            {...props}
        >
            <Text as="h4" size="md" color="gray.500">
                {children}
            </Text>
        </Flex>
    );
};

export default BlankCard;
