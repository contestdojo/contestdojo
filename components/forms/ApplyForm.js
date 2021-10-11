/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Button, Checkbox, FormControl, FormErrorMessage, FormLabel, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import FormField from "~/components/FormField";

const buildSchema = maxTeams => {
    let applyTeams = yup.number().typeError("Invalid number").required().min(1).label("Number of Teams");
    if (maxTeams) applyTeams = applyTeams.max(maxTeams);

    return yup.object({
        applyTeams,
        expectedStudents: yup
            .number()
            .typeError("Invalid number")
            .required()
            .min(1)
            .label("Expected Number of Students"),
        confirmUS: yup.boolean().required().equals([true], "You must select this checkbox."),
    });
};

const ApplyForm = ({ onSubmit, isLoading, error, buttonText, defaultValues, maxTeams, open }) => {
    const { register, handleSubmit, errors } = useForm({
        defaultValues,
        mode: "onTouched",
        resolver: yupResolver(buildSchema(maxTeams)),
    });

    // TODO: Number Input

    if (!open) onSubmit = () => {};

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error.message}
                    </Alert>
                )}

                <FormField
                    ref={register}
                    name="applyTeams"
                    label="Number of Teams"
                    placeholder="3"
                    error={errors.applyTeams}
                    helperText="You may be approved for up to this many teams."
                    disabled={!open}
                    isRequired
                />

                <FormField
                    ref={register}
                    name="expectedStudents"
                    label="Expected Number of Students"
                    placeholder="24"
                    error={errors.expectedStudents}
                    helperText="The number of students is not binding, but please provide your best estimate."
                    disabled={!open}
                    isRequired
                />

                <FormControl id="confirmUS" isInvalid={errors.confirmUS} isRequired>
                    <FormLabel>This organization is located in the United States.</FormLabel>
                    <Checkbox ref={register} name="confirmUS" disabled={!open}>
                        I confirm
                    </Checkbox>
                    <FormErrorMessage>{errors.confirmUS?.message}</FormErrorMessage>
                </FormControl>

                <Button isLoading={isLoading} type="submit" colorScheme="blue" disabled={!open}>
                    {!open ? "Registration Closed" : buttonText ?? "Submit"}
                </Button>
            </Stack>
        </form>
    );
};

export default ApplyForm;
