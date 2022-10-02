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
import type { FormControlProps } from "~/components/forms/form-control";
import type Input from "~/components/forms/input";
import type Select from "~/components/forms/select";

import { withZod } from "@remix-validated-form/with-zod";
import { useMemo } from "react";
import { useIsSubmitting, ValidatedForm } from "remix-validated-form";

import Button from "~/components/button";
import Field from "~/components/forms/schema-form/field";

function SubmitButton() {
  const isSubmitting = useIsSubmitting();

  return (
    <Button type="submit" disabled={isSubmitting}>
      Submit
    </Button>
  );
}

type SchemaFormProps<T extends ZodRawShape, S extends ZodObject<T>> = Omit<
  FormProps<z.infer<S>>,
  "validator"
> & {
  id: string;
  sharedProps?: Partial<FormControlProps<any>>;
  fieldProps?: Partial<{
    [key in keyof z.infer<S>]: T[key] extends ZodString | ZodNumber | ZodDate | ZodBoolean
      ? Partial<FormControlProps<typeof Input>>
      : T[key] extends ZodEnum<any>
      ? Partial<FormControlProps<typeof Select>>
      : {};
  }>;
  labels?: Partial<{ [key in keyof z.infer<S>]: string }>;
  schema: S;
};

export default function SchemaForm<T extends ZodRawShape, S extends ZodObject<T>>({
  id,
  schema,
  sharedProps,
  fieldProps,
  labels,
  children,
  ...props
}: SchemaFormProps<T, S>) {
  const validator = useMemo(() => withZod(schema), [schema]);

  return (
    <ValidatedForm id={id} validator={validator} {...props}>
      {Object.entries(schema.shape).map(([_name, type]) => {
        const name = _name as keyof z.infer<S>;

        return (
          <Field
            key={_name}
            name={_name}
            type={type}
            label={labels?.[name]}
            extraProps={{ ...sharedProps, ...fieldProps?.[name] }}
          />
        );
      })}

      <input type="hidden" name="_form" value={id} />

      {children}

      <SubmitButton />
    </ValidatedForm>
  );
}
