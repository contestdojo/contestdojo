import { EditablePreview } from "@chakra-ui/editable";

const StyledEditablePreview = () => (
    <EditablePreview
        width="100%"
        _hover={{
            boxShadow: "0 0 0 3px rgb(0 0 0 / 10%)",
            borderRadius: "0.375rem",
            cursor: "pointer",
        }}
    />
);

export default StyledEditablePreview;
