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
          return [v.id, field];
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

      const field = (
        // @ts-ignore
        <FormField
          {...register(`${fieldPath}.${x.id}`)}
          label={x.label}
          // @ts-ignore
          error={errors[fieldPath]?.[x.id]}
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
            key={`customFields.${x.id}`}
            label="This field may not be edited. Please contact the tournament organizer if you have any questions or concerns."
          >
            <Box>{field}</Box>
          </Tooltip>
        );
      }

      return field;
    });
