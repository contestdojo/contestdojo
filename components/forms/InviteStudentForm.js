/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";
import ResizingTextarea from "~/components/ResizingTextarea";

const schema = yup.object({
  emails: yup
    .array()
    .required("Must be a list of valid email addresses")
    .label("Email Addresses")
    .transform(function (value, originalValue) {
      if (this.isType(value) && value !== null) {
        return value;
      }
      return originalValue ? originalValue.trim().split(/\n+/) : [];
    })
    .of(yup.string().email(({ value }) => `${value} is not a valid email`)),
});

const InviteStudentForm = ({ onSubmit, error, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(schema),
  });

  return (
    <form id="invite-students" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error.message}
          </Alert>
        )}

        <FormField
          {...register("emails")}
          as={ResizingTextarea}
          name="emails"
          label="Email Addresses (one per line)"
          placeholder={"student1@gmail.com\nstudent2@gmail.com"}
          error={errors.emails}
          isRequired
        />
      </Stack>
    </form>
  );
};

export default InviteStudentForm;
