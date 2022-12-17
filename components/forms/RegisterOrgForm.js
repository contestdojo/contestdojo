/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Button, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { makeCustomFieldsSchema, renderCustomFields } from "./customFields";

const RegisterOrgForm = ({ onSubmit, error, customFields, isLoading, buttonText, defaultValues }) => {
  const schema = useMemo(
    () =>
      yup.object({
        customFields: makeCustomFieldsSchema(customFields),
      }),
    [customFields]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(schema),
    defaultValues,
  });

  return (
    <form id="add-student" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error.message}
          </Alert>
        )}

        {renderCustomFields(customFields, register, errors)}

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          {buttonText ?? "Submit"}
        </Button>
      </Stack>
    </form>
  );
};

export default RegisterOrgForm;
