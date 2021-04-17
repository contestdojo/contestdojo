import { Heading } from "@chakra-ui/react";
import ChakraUIRenderer, { defaults } from "chakra-ui-markdown-renderer";
import ReactMarkdown from "react-markdown";

const chakraRendererOptions = {
    ...defaults,
    heading: props => {
        const { level, children } = props;
        const sizes = ["md", "sm", "xs", "xs", "xs", "xs"];
        return (
            <Heading my={4} as={`h${level}`} size={sizes[`${level - 1}`]} {...getCoreProps(props)}>
                {children}
            </Heading>
        );
    },
};

const getCoreProps = props => (props["data-sourcepos"] ? { "data-sourcepos": props["data-sourcepos"] } : {});

const Markdown = ({ children }) => (
    <ReactMarkdown renderers={ChakraUIRenderer(chakraRendererOptions)} escapeHtml={false} source={children} />
);

export default Markdown;
