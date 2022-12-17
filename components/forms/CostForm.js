/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Button, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";
import ResizingTextarea from "~/components/ResizingTextarea";

const schema = yup.object({
  costPerStudent: yup.lazy((value) =>
    value === "" ? yup.string().label("Base Cost per Student") : yup.number().label("Base Cost per Student")
  ),
  costDescription: yup.string().label("Cost Description"),
});

const CostForm = ({ onSubmit, isLoading, error, buttonText, defaultValues }) => {
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
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error.message}
        </Alert>
      )}

      <Stack spacing={4}>
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error.message}
          </Alert>
        )}

        <FormField
          type="number"
          {...register("costPerStudent")}
          label="Base Cost per Student"
          placeholder="8"
          error={errors.costPerStudent}
          helperText="Edit cost adjustments on the new admin panel."
          maxW="md"
        />

        <FormField
          as={ResizingTextarea}
          {...register("costDescription")}
          label="Cost Description (markdown)"
          placeholder="Cost Description"
          error={errors.costDescription}
        />

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          {buttonText ?? "Submit"}
        </Button>
      </Stack>
    </form>
  );
};

export default CostForm;
