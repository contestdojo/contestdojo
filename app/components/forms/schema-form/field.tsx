/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentPropsWithRef } from "react";
import type { FormControlProps } from "~/components/forms/form-control";
import type Input from "~/components/forms/input";

import React from "react";
import { useField } from "remix-validated-form";

import FormControl from "~/components/forms/form-control";

function getDefaultProps(name: string) {
  const ownName = name.split(".").pop() ?? name;
  const label = ownName.charAt(0).toUpperCase() + ownName.replace(/([A-Z])/g, " $1").slice(1);
  const placeholder = `Enter ${label.toLowerCase()}...`;

  return { label, placeholder };
}

export type FieldProps<T extends React.ElementType> = FormControlProps<T>;

export default function Field<T extends React.ElementType = typeof Input>({
  name,
  ...props
}: FieldProps<T>) {
  const { error, getInputProps } = useField(name);

  return (
    <FormControl
      className="flex-1"
      name={name}
      error={error}
      {...getDefaultProps(name)}
      {...getInputProps(props as ComponentPropsWithRef<T>)}
    />
  );
}
