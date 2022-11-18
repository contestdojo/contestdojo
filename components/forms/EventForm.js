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
  name: yup.string().required().label("Event Name"),
  studentsPerTeam: yup.number().required().label("# Students per Team"),
  description: yup.string().label("Description"),
  costPerStudent: yup.lazy((value) =>
    value === "" ? yup.string().label("Cost per Student") : yup.number().label("Cost per Student")
  ),
  costDescription: yup.string().label("Description"),
  waiver: yup.string().label("Waiver"),
});

const EventForm = ({ onSubmit, isLoading, error, buttonText, defaultValues }) => {
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
          name="name"
          label="Event Name"
          placeholder="Math High School"
          error={errors.name}
          maxW="md"
          isRequired
        />

        <FormField
          ref={register}
          type="number"
          name="studentsPerTeam"
          label="# Students per Team"
          placeholder="8"
          error={errors.studentsPerTeam}
          maxW="md"
          isRequired
        />

        <FormField
          ref={register}
          as={ResizingTextarea}
          name="description"
          label="Description (markdown)"
          placeholder="Description"
          error={errors.description}
        />

        <FormField
          ref={register}
          type="number"
          name="costPerStudent"
          label="Cost per Student"
          placeholder="8"
          error={errors.costPerStudent}
          maxW="md"
        />

        <FormField
          ref={register}
          as={ResizingTextarea}
          name="costDescription"
          label="Cost Description (markdown)"
          placeholder="Cost Description"
          error={errors.costDescription}
        />

        <FormField
          ref={register}
          as={ResizingTextarea}
          name="waiver"
          label="Waiver (markdown)"
          placeholder="Waiver"
          error={errors.waiver}
        />

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          {buttonText ?? "Submit"}
        </Button>
      </Stack>
    </form>
  );
};

export default EventForm;
