/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Box, Select, Textarea, Tooltip } from "@chakra-ui/react";
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
    multiline?: boolean;
  };
  helpText?: string;
  validationRegex?: string;
};

// Helper to create a form-safe key from a custom field ID.
// This prevents react-hook-form from interpreting numeric IDs as array indices.
const toFormKey = (id: string) => `_${id}`;
const fromFormKey = (key: string) => key.slice(1);

// Transform custom field data from storage format to form format (add prefix to keys)
export const customFieldsToFormData = (data: Record<string, unknown> | undefined): Record<string, unknown> => {
  if (!data) return {};
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [toFormKey(k), v]));
};

// Transform custom field data from form format to storage format (remove prefix from keys)
export const customFieldsFromFormData = (data: Record<string, unknown> | undefined): Record<string, unknown> => {
  if (!data) return {};
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [fromFormKey(k), v]));
};

export const makeCustomFieldsSchema = (initial: boolean, customFields: CustomField[]) =>
  yup.object(
    Object.fromEntries(
      customFields
        .filter((v) => !v.flags.hidden)
        .filter((v) => v.flags.editable || initial)
        .map((v) => {
          let field = yup.string().label(v.label);
          if (v.flags.required) field = field.required();
          if (v.choices) field = field.oneOf(v.choices).transform((x) => (x === "" ? undefined : x));
          if (v.validationRegex) field = field.matches(new RegExp(v.validationRegex));
          return [toFormKey(v.id), field];
        })
    )
  );

export const renderCustomFields = (
  initial: boolean,
  customFields: CustomField[],
  register: UseFormRegister<any>,
  errors: Partial<FieldErrorsImpl<any>>,
  fieldPath: string = "customFields"
) =>
  customFields
    .filter((v) => !v.flags.hidden)
    .map((x) => {
      let fieldAs = undefined;
      if (x.choices) {
        fieldAs = Select;
      } else if (x.flags.multiline) {
        fieldAs = Textarea;
      }

      const formKey = toFormKey(x.id);
      const field = (
        // @ts-ignore
        <FormField
          {...register(`${fieldPath}.${formKey}`)}
          label={x.label}
          // @ts-ignore
          error={errors[fieldPath]?.[formKey]}
          isRequired={x.flags.required}
          as={fieldAs}
          placeholder={x.choices ? "Select..." : ""}
          isDisabled={!x.flags.editable && !initial}
          helperText={x.helpText}
        >
          {x.choices &&
            x.choices.map((v, i) => (
              <option key={i} value={v}>
                {v}
              </option>
            ))}
        </FormField>
      );

      if (!x.flags.editable && !initial) {
        return (
          <Tooltip
            key={`customFields.${formKey}`}
            label="This field may not be edited. Please contact the tournament organizer if you have any questions or concerns."
          >
            <Box>{field}</Box>
          </Tooltip>
        );
      }

      return field;
    });
