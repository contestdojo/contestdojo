/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { FetcherWithComponents } from "@remix-run/react";
import type { PropsWithChildren } from "react";
import type { FormProps } from "remix-validated-form";
import type { z, ZodObject, ZodRawShape } from "zod";
import type { FieldProps, Overrides } from "./from-zod";

import { withZod } from "@remix-validated-form/with-zod";
import clsx from "clsx";
import { useMemo } from "react";
import { useIsSubmitting, ValidatedForm } from "remix-validated-form";

import { Button } from "~/components/ui";

import { FromZodObject } from "./from-zod-object";

type SubmitButtonProps = PropsWithChildren<{
  formId?: string;
  className?: string;
}>;

export function SubmitButton({ formId, className, children }: SubmitButtonProps) {
  const isSubmitting = useIsSubmitting(formId);

  return (
    <Button type="submit" form={formId} disabled={isSubmitting} className={className}>
      {children ?? "Submit"}
    </Button>
  );
}

type SchemaFormOwnProps<S extends ZodRawShape, T extends ZodObject<S>> = {
  fetcher?: FetcherWithComponents<unknown>;
  id: string;
  schema: T;
  buttonLabel?: string;
  showButton?: boolean;
  fieldProps?: FieldProps<T>;
  overrides?: Overrides<T>;
};

type SchemaFormProps<S extends ZodRawShape, T extends ZodObject<S>> = SchemaFormOwnProps<S, T> &
  Omit<FormProps<z.infer<T>, undefined>, "validator">;

export function SchemaForm<S extends ZodRawShape, T extends ZodObject<S>>({
  fetcher,
  id,
  schema,
  buttonLabel,
  showButton = true,
  fieldProps,
  overrides,
  className,
  children,
  ...props
}: SchemaFormProps<S, T>) {
  const validator = useMemo(() => withZod(schema), [schema]);

  return (
    <ValidatedForm
      className={clsx`flex flex-col gap-5 ${className}`}
      id={id}
      validator={validator}
      fetcher={fetcher}
      {...props}
    >
      <div className="flex flex-col gap-5">
        <FromZodObject fieldProps={fieldProps} overrides={overrides} type={schema} />
        <input type="hidden" name="_form" value={id} />
        {children}
      </div>
      {showButton && (
        <div className="flex flex-1 flex-col items-stretch justify-end">
          <SubmitButton>{buttonLabel}</SubmitButton>
        </div>
      )}
    </ValidatedForm>
  );
}
