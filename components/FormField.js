import { FormControl, FormErrorMessage, FormLabel, Input } from "@chakra-ui/react";
import { forwardRef } from "react";

const FormField = forwardRef(({ type, name, label, placeholder, error, as, children, ...props }, ref) => {
    const Component = as ?? Input;

    return (
        <FormControl id={name} isInvalid={error} {...props}>
            <FormLabel>{label}</FormLabel>
            <Component ref={ref} type={type ?? "text"} name={name} placeholder={placeholder}>
                {children}
            </Component>
            <FormErrorMessage>{error?.message}</FormErrorMessage>
        </FormControl>
    );
});

export default FormField;
