/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { FormProps } from "remix-validated-form";
import type {
  z,
  ZodBoolean,
  ZodDate,
  ZodEnum,
  ZodNumber,
  ZodObject,
  ZodRawShape,
  ZodString,
} from "zod";

import { withZod } from "@remix-validated-form/with-zod";
import { useMemo } from "react";
import { ValidatedForm } from "remix-validated-form";

import Field from "~/components/forms/schema-form/field";

type SchemaFormProps<T extends ZodRawShape, S extends ZodObject<T>> = Omit<
  FormProps<z.infer<S>>,
  "validator"
> & {
  fieldProps?: Partial<{
    [key in keyof z.infer<S>]: T[key] extends ZodString | ZodNumber | ZodDate | ZodBoolean
      ? Partial<JSX.IntrinsicElements["input"]>
      : T[key] extends ZodEnum<any>
      ? Partial<JSX.IntrinsicElements["select"]>
      : {};
  }>;
  schema: S;
};

export default function SchemaForm<T extends ZodRawShape, S extends ZodObject<T>>({
  schema,
  fieldProps,
  children,
  ...props
}: SchemaFormProps<T, S>) {
  const validator = useMemo(() => withZod(schema), [schema]);

  return (
    <ValidatedForm validator={validator} {...props}>
      {Object.entries(schema.shape).map(([name, type]) => (
        <Field
          key={name}
          name={name}
          type={type}
          extraProps={fieldProps?.[name as keyof z.infer<S>]}
        />
      ))}
      {children}
    </ValidatedForm>
  );
}
