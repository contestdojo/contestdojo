import { FormControl, FormErrorMessage, FormLabel, Input } from "@chakra-ui/react";
import { forwardRef } from "react";

const FormField = forwardRef(({ type, name, label, placeholder, error, isRequired, ...props }, ref) => (
    <FormControl id={name} isInvalid={error} {...props}>
        <FormLabel>{label}</FormLabel>
        <Input ref={ref} type={type ?? "text"} name={name} placeholder={placeholder} />
        <FormErrorMessage>{error?.message}</FormErrorMessage>
    </FormControl>
));

export default FormField;
