/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodTypeAny } from "zod";

import Checkbox from "~/components/forms/checkbox";
import FormControl from "~/components/forms/form-control";
import { shapeInfo } from "~/components/forms/schema-form/shape-info";

function generateLabel(name: string) {
  return name
    .slice(0)
    .replace(/(\p{Lu})/g, " $1")
    .toLowerCase();
}

type FieldProps<T extends ZodTypeAny> = {
  name: string;
  type: T;
  extraProps?: any;
};

export default function Field<T extends ZodTypeAny>({ name, type, extraProps }: FieldProps<T>) {
  const { typeName, getDefaultValue, enumValues } = shapeInfo(type);
  if (getDefaultValue) throw new Error("Zod default value is unsupported");

  const label = generateLabel(name);

  const props = {
    name,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    placeholder: `Enter ${label}...`,
  };

  if (typeName === "ZodString") return <FormControl {...props} type="text" {...extraProps} />;
  if (typeName === "ZodNumber") return <FormControl {...props} type="number" {...extraProps} />;
  if (typeName === "ZodDate") return <FormControl {...props} type="date" {...extraProps} />;

  if (typeName === "ZodBoolean") {
    return <FormControl {...props} as={Checkbox} labelInside {...extraProps} />;
  }

  if (typeName === "ZodEnum") {
    return (
      <FormControl {...props} as={Checkbox} {...extraProps}>
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
