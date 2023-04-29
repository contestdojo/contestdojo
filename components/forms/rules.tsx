/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Button, HStack, IconButton, Select } from "@chakra-ui/react";
import { Control, FieldErrorsImpl, useFieldArray, UseFormRegister } from "react-hook-form";
import { HiTrash } from "react-icons/hi";
import * as yup from "yup";

import FormField from "../FormField";
import { CustomField } from "./customFields";

type Field = { id: string; label: string };

const VALUE_PLACEHOLDERS = {
  "=": "Enter value",
  "!=": "Enter value",
  "=~": "Enter regex",
  "!~": "Enter regex",
  in: "Enter values, comma-separated",
};

export const rulesSchema = yup.array(
  yup.object({
    field: yup.string().label("Fields").required(),
    rule: yup.string().oneOf(["=", "!=", "=~", "!~", "in"]).required(),
    value: yup.string().required(),
  })
);

type RenderRulesProps = {
  name: string;
  defaultFields: Field[];
  customFields: {
    pathPrefix?: string;
    labelPrefix?: string;
    fields: CustomField[];
  }[];
  control: Control<any, any>;
  values: any;
  register: UseFormRegister<any>;
  errors: Partial<FieldErrorsImpl<any>>;
};

export const RenderRules = ({
  name,
  defaultFields,
  customFields,
  control,
  values,
  register,
  errors,
}: RenderRulesProps) => {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <>
      {fields.map((item, index) => (
        <HStack key={item.id} alignItems="flex-end">
          {/* @ts-ignore */}
          <FormField
            as={Select}
            {...register(`${name}.${index}.field`)}
            label="Field"
            error={errors[`${name}.${index}.field`]}
          >
            {defaultFields.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
            {customFields.map((r) =>
              r.fields.map((x) => (
                <option
                  key={`${r.pathPrefix ?? ""}customFields.${x.id}`}
                  value={`${r.pathPrefix ?? ""}customFields.${x.id}`}
                >
                  [Custom] {r.labelPrefix ?? ""}
                  {x.label}
                </option>
              ))
            )}
          </FormField>

          {/* @ts-ignore */}
          <FormField
            as={Select}
            {...register(`${name}.${index}.rule`)}
            label="Rule"
            error={errors[`${name}.${index}.rule`]}
          >
            <option value="=">Equals</option>
            <option value="!=">Does not equal</option>
            <option value="=~">Contains regex</option>
            <option value="!~">Does not contain regex</option>
            <option value="in">One of</option>
          </FormField>

          <FormField
            {...register(`${name}.${index}.value`)}
            // @ts-ignore
            label="Value"
            error={errors[`${name}.${index}.value`]}
            // @ts-ignore
            placeholder={VALUE_PLACEHOLDERS[values?.[index]?.rule]}
          />

          <IconButton aria-label="Delete" icon={<HiTrash />} onClick={() => remove(index)} />
        </HStack>
      ))}

      <Button type="button" alignSelf="flex-start" onClick={() => append({ field: "", rule: "=", value: "" })}>
        Add Rule
      </Button>
    </>
  );
};
