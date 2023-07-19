/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentPropsWithRef } from "react";
import type { FormControlProps, Input } from "~/components/ui";

import { format, parseISO } from "date-fns";
import React from "react";
import { useControlField, useField } from "remix-validated-form";

import { FormControl } from "~/components/ui";

function getDefaultProps(name: string) {
  const ownName = name.split(".").pop() ?? name;
  const label = ownName.charAt(0).toUpperCase() + ownName.replace(/([A-Z])/g, " $1").slice(1);
  const placeholder = `Enter ${label.toLowerCase()}...`;

  return { label, placeholder };
}

export function Field<T extends React.ElementType = typeof Input>({
  name,
  type,
  ...props
}: FormControlProps<T>) {
  const { error, getInputProps } = useField(name);
  const [value, setValue] = useControlField<any>(name);

  const allProps: FormControlProps<typeof Input> = {
    name,
    type,
    error,
    ...getDefaultProps(name),
    ...props,
  };

  if (type === "checkbox") {
    allProps.checked = value;
    allProps.onChange = (e) => setValue(e.target.checked);
  } else if (type === "datetime-local") {
    allProps.value = format(parseISO(value), "yyyy-MM-dd'T'HH:mm:ss.SSS");
    allProps.onChange = (e) => setValue(e.target.value);
  } else {
    allProps.value = value ?? "";
    allProps.onChange = (e) => setValue(e.target.value);
  }

  const { defaultChecked, ...rvfProps } = getInputProps(allProps as ComponentPropsWithRef<T>);

  return <FormControl {...allProps} {...rvfProps} />;
}
