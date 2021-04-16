import { Button } from "@chakra-ui/button";
import NextLink from "next/link";

const ButtonLink = ({ href, children, ...props }) => (
    <NextLink href={href} passHref>
        <Button as="a" {...props}>
            {children}
        </Button>
    </NextLink>
);

export default ButtonLink;
