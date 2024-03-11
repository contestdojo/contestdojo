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
          {...register("name")}
          label="Event Name"
          placeholder="Math High School"
          error={errors.name}
          maxW="md"
          isRequired
        />

        <FormField
          type="number"
          {...register("studentsPerTeam")}
          label="# Students per Team"
          placeholder="8"
          error={errors.studentsPerTeam}
          maxW="md"
          isRequired
        />

        <FormField
          as={ResizingTextarea}
          {...register("description")}
          label="Description (markdown)"
          placeholder="Description"
          error={errors.description}
        />

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          {buttonText ?? "Submit"}
        </Button>
      </Stack>
    </form>
  );
};

export default EventForm;
