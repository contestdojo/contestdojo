/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Select } from "@chakra-ui/react";
import { FieldErrorsImpl, UseFormRegister } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";

export type CustomField = {
  id: string;
  label: string;
  choices?: string[];
  flags: {
    required?: boolean;
    editable?: boolean;
    hidden?: boolean;
  };
};

export const makeCustomFieldsSchema = (customFields: CustomField[]) =>
  yup.object(
    Object.fromEntries(
      customFields
        .filter((v) => !v.flags.hidden)
        .map((v) => {
          let field = yup.string().label(v.label);
          if (v.flags.required) field = field.required();
          if (v.choices) field = field.oneOf(v.choices).transform((x) => (x === "" ? undefined : x));
          return [v.id, field];
        })
    )
  );

export const renderCustomFields = (
  customFields: CustomField[],
  register: UseFormRegister<any>,
  errors: Partial<FieldErrorsImpl<any>>
) =>
  customFields
    .filter((v) => !v.flags.hidden)
    .map((x) => (
      // @ts-ignore
      <FormField
        key={`customFields.${x.id}`}
        {...register(`customFields.${x.id}`)}
        label={x.label}
        error={errors[`customFields.${x.id}`]}
        isRequired={x.flags.required}
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
    ));
