/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Button, Select, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";

const AddStudentForm = ({
  initialFocusRef,
  onSubmit,
  error,
  customFields,
  isLoading,
  buttonText,
  showButton = true,
  allowEditEmail = true,
  defaultValues,
}) => {
  const hasCustomGrade = customFields.filter((v) => !v.hidden).some((x) => x.id === "grade");
  const schema = useMemo(
    () =>
      yup.object({
        fname: yup.string().required().label("First Name"),
        lname: yup.string().required().label("Last Name"),
        ...(!hasCustomGrade ? { grade: yup.number().typeError("Invalid number").required().label("Grade") } : {}),
        ...(allowEditEmail ? { email: yup.string().email().required().label("Email Address") } : {}),
        customFields: yup.object(
          Object.fromEntries(
            customFields
              .filter((v) => !v.hidden)
              .map((v) => {
                let field = yup.string().label(v.label);
                if (v.required) field = field.required();
                if (v.choices) field = field.oneOf(v.choices).transform((x) => (x === "" ? undefined : x));
                return [v.id, field];
              })
          )
        ),
      }),
    [customFields, allowEditEmail]
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

        <FormField
          {...register("fname")}
          name="fname"
          label="First Name"
          placeholder="Blaise"
          error={errors.fname}
          isRequired
        />

        <FormField {...register("lname")} label="Last Name" placeholder="Pascal" error={errors.lname} isRequired />

        <FormField
          type="email"
          {...register("email")}
          label="Email Address"
          placeholder="blaise.pascal@gmail.com"
          error={errors.email}
          isDisabled={!allowEditEmail}
          isRequired={allowEditEmail}
        />

        {!hasCustomGrade && (
          <FormField
            as={Select}
            {...register("grade")}
            label="Grade"
            placeholder="Select Grade"
            error={errors.grade}
            isRequired
          >
            <option value="6">6 or below</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12 or above</option>
          </FormField>
        )}

        {customFields
          .filter((v) => !v.hidden)
          .map((x) => (
            <FormField
              key={`customFields.${x.id}`}
              {...register(`customFields.${x.id}`)}
              label={x.label}
              error={errors[`customFields.${x.id}`]}
              isRequired={x.required}
              as={x.choices ? Select : undefined}
              placeholder={x.choices ? "Select..." : ""}
            >
              {x.choices &&
                x.choices.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
            </FormField>
          ))}

        {showButton && (
          <Button isLoading={isLoading} type="submit" colorScheme="blue">
            {buttonText ?? "Submit"}
          </Button>
        )}
      </Stack>
    </form>
  );
};

export default AddStudentForm;
