/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentPropsWithoutRef } from "react";
import type { LabelProps } from "~/components/forms/label";
import type { PropsWithAsAndRef } from "~/lib/utils/props-with-as";

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import React from "react";
import { useField } from "remix-validated-form";
import { twMerge } from "tailwind-merge";

import Input from "~/components/forms/input";
import Label from "~/components/forms/label";

export type FormControlProps<T extends React.ElementType> = PropsWithAsAndRef<
  {
    name: string;
    label?: string;
    labelInside?: boolean;
    labelProps?: LabelProps;
    className?: string;
  },
  T
>;

export default function FormControl<T extends React.ElementType = typeof Input>({
  as,
  name,
  label,
  labelInside = false,
  labelProps,
  className,
  ...props
}: FormControlProps<T>) {
  const As = as ?? Input;
  const { error, getInputProps } = useField(name);

  const labelElement = label && (
    <Label htmlFor={name} {...labelProps}>
      {label}
    </Label>
  );

  return (
    <div className={twMerge(clsx`flex flex-col gap-2 ${className}`)}>
      {!labelInside && labelElement}

      <div className="flex flex-1 flex-col gap-2">
        <div className="relative flex items-center gap-2">
          <As
            id={name}
            {...getInputProps(props as ComponentPropsWithoutRef<T>)}
            invalid={error !== undefined}
          />

          {labelInside && labelElement}

          {error && (
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 bg-white text-red-500" aria-hidden="true" />
            </div>
          )}
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}
