/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentPropsWithoutRef } from "react";
import type { ZodTypeAny } from "zod";

import { useControlField } from "remix-validated-form";

import Checkbox from "~/components/forms/checkbox";
import FormControl from "~/components/forms/form-control";
import { shapeInfo } from "~/components/forms/schema-form/shape-info";
import Select from "~/components/forms/select";

type FieldProps<T extends ZodTypeAny> = {
  name: string;
  label: string;
  type: T;
  extraProps?: Partial<ComponentPropsWithoutRef<typeof FormControl>>;
};

export default function Field<T extends ZodTypeAny>({
  name,
  label,
  type,
  extraProps,
}: FieldProps<T>) {
  const { typeName, getDefaultValue, enumValues } = shapeInfo(type);
  const [value, setValue] = useControlField<string>(name);
  if (getDefaultValue) throw new Error("Zod default value is unsupported");

  const props = {
    name,
    label,
    placeholder: `Enter ${label}...`,
    value: value ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValue(e.target.value),
  };

  if (typeName === "ZodString") return <FormControl type="text" {...props} {...extraProps} />;
  if (typeName === "ZodNumber") return <FormControl {...props} type="number" {...extraProps} />;
  if (typeName === "ZodDate") return <FormControl {...props} type="date" {...extraProps} />;
  if (typeName === "ZodBoolean")
    return <FormControl {...props} as={Checkbox} type="checkbox" {...extraProps} />;

  if (typeName === "ZodEnum") {
    return (
      <FormControl {...props} as={Select} {...extraProps}>
        {enumValues?.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </FormControl>
    );
  }

  return null;
}
