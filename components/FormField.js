/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

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
