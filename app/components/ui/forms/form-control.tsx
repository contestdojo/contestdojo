/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithAs } from "~/lib/utils/props-with-as";

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import React from "react";
import { twMerge } from "tailwind-merge";

import { Input, Label } from ".";

export type FormControlProps<T extends React.ElementType> = PropsWithAs<
  {
    name: string;
    label?: string;
    labelInside?: boolean;
    help?: string;
    error?: string;
    className?: string;
  },
  T
>;

export function FormControl<T extends React.ElementType = typeof Input>({
  as,
  name,
  label,
  labelInside = false,
  help,
  error,
  className,
  ...props
}: FormControlProps<T>) {
  const As = as ?? Input;

  const labelElement = label && <Label htmlFor={name}>{label}</Label>;

  return (
    <div className={twMerge("flex flex-col gap-2", className)}>
      {!labelInside && labelElement}

      <div className="flex flex-1 flex-col gap-2">
        <div className="relative flex items-center gap-2">
          <As id={name} name={name} {...props} invalid={error !== undefined} />

          {labelInside && labelElement}

          {error && (
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 bg-white text-red-500" aria-hidden="true" />
            </div>
          )}
        </div>

        {help && <div className="text-sm text-gray-400">{help}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}
