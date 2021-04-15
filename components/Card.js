import { Box } from "@chakra-ui/layout";
import { forwardRef } from "@chakra-ui/system";

const Card = forwardRef(({ children, ...props }, ref) => (
    <Box borderWidth={1} borderRadius="md" backgroundColor="white" ref={ref} {...props}>
        {children}
    </Box>
));

export default Card;
