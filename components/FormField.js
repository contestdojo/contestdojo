import { FormControl, FormErrorMessage, FormHelperText, FormLabel, Input } from "@chakra-ui/react";
import { forwardRef } from "react";

const FormField = forwardRef(
    ({ type, name, label, placeholder, helperText, error, as, children, disabled, ...props }, ref) => {
        const Component = as ?? Input;

        return (
            <FormControl id={name} isInvalid={error} {...props}>
                <FormLabel>{label}</FormLabel>
                <Component ref={ref} type={type ?? "text"} name={name} placeholder={placeholder} disabled={disabled}>
                    {children}
                </Component>
                {helperText && <FormHelperText>{helperText}</FormHelperText>}
                <FormErrorMessage>{error?.message}</FormErrorMessage>
            </FormControl>
        );
    }
);

export default FormField;
