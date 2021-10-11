import { Box, BoxProps } from "@chakra-ui/layout";
import { forwardRef } from "@chakra-ui/system";

type CardProps = BoxProps;

const Card = forwardRef(({ children, ...props }: BoxProps, ref) => (
    <Box borderWidth={1} borderRadius="md" backgroundColor="white" ref={ref} {...props}>
        {children}
    </Box>
));

export default Card;
