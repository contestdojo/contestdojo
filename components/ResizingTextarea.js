import { Textarea } from "@chakra-ui/react";
import TextareaAutosize from "react-textarea-autosize";

const ResizingTextarea = props => (
    <Textarea
        minH="unset"
        overflow="hidden"
        transition="none"
        resize="none"
        minRows={1}
        as={TextareaAutosize}
        {...props}
    />
);

export default ResizingTextarea;
