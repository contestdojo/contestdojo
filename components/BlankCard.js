import Card from "./Card";

const { Flex, Text } = require("@chakra-ui/layout");

const BlankCard = ({ children, ...props }) => {
    return (
        <Card
            as={Flex}
            m={2}
            p={4}
            flex={1}
            justifyContent="center"
            alignItems="center"
            borderStyle="dashed"
            {...props}
        >
            <Text as="h4" size="md" color="gray.500">
                {children}
            </Text>
        </Card>
    );
};

export default BlankCard;
