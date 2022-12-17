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
  defaultFields: Field[];
  customFields: CustomField[];
  control: Control<any, any>;
  values: any;
  register: UseFormRegister<any>;
  errors: Partial<FieldErrorsImpl<any>>;
};

export const RenderRules = ({ defaultFields, customFields, control, values, register, errors }: RenderRulesProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "rules",
  });

  return (
    <>
      {fields.map((item, index) => (
        <HStack key={item.id} alignItems="flex-end">
          {/* @ts-ignore */}
          <FormField
            as={Select}
            {...register(`rules.${index}.field`)}
            label="Field"
            error={errors[`rules.${index}.field`]}
          >
            {defaultFields.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
            {customFields.map((x) => (
              <option key={`customFields.${x.id}`} value={`customFields.${x.id}`}>
                [Custom] {x.label}
              </option>
            ))}
          </FormField>

          {/* @ts-ignore */}
          <FormField
            as={Select}
            {...register(`rules.${index}.rule`)}
            label="Rule"
            error={errors[`rules.${index}.rule`]}
          >
            <option value="=">Equals</option>
            <option value="!=">Does not equal</option>
            <option value="=~">Contains regex</option>
            <option value="!~">Does not contain regex</option>
            <option value="in">One of</option>
          </FormField>

          <FormField
            {...register(`rules.${index}.value`)}
            // @ts-ignore
            label="Value"
            error={errors[`rules.${index}.value`]}
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
