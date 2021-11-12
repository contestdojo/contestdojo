/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Button, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";

const schema = yup.object({
  parentEmail: yup.string().email().required().label("Parent/Guardian Email Address"),
});

const WaiverRequestForm = ({ onSubmit, isLoading, error, buttonText, defaultValues }) => {
  const { register, handleSubmit, errors } = useForm({
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
          name="parentEmail"
          label="Parent Email Address"
          placeholder="john.doe@gmail.com"
          error={errors.parentEmail}
          isRequired
        />

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          {buttonText ?? "Request Waiver"}
        </Button>
      </Stack>
    </form>
  );
};

export default WaiverRequestForm;
