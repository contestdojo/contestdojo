/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Button, FormControl, FormErrorMessage, FormLabel, Select, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";

const schema = yup.object({
  parentEmail: yup.string().email().required().label("Parent Email Address"),
  birthdate: yup
    .string()
    .matches(/^\d{1,2}\/\d\d{1,2}\/\d{4}$/, "Must be a valid date")
    .required()
    .label("Birthdate"),
  gender: yup.string().required().label("Gender"),
});

const ParentEmailForm = ({ onSubmit, isLoading, error, buttonText, defaultValues }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: "onTouched",
    resolver: yupResolver(schema),
  });

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
          name="birthdate"
          label="Birthdate"
          placeholder="MM/DD/YYYY"
          error={errors.birthdate}
          isRequired
        />

        <FormField
          ref={register}
          name="parentEmail"
          label="Parent Email Address"
          placeholder="john.doe@gmail.com"
          error={errors.parentEmail}
          isRequired
        />

        <FormControl id="gender" isInvalid={errors.gender} isRequired>
          <FormLabel>Gender</FormLabel>
          <Select ref={register} name="gender" placeholder="Select option">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
          <FormErrorMessage>{errors.gender?.message}</FormErrorMessage>
        </FormControl>

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          {buttonText ?? "Submit"}
        </Button>
      </Stack>
    </form>
  );
};

export default ParentEmailForm;
