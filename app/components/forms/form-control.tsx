/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithAsAndRef } from "~/lib/utils/props-with-as";

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import React from "react";
import { useField } from "remix-validated-form";

import Input from "~/components/forms/input";
import Label from "~/components/forms/label";

type FormControlProps = {
  name: string;
  label?: string;
  labelInside?: boolean;
  className?: string;
};

export default function FormControl<T extends React.ElementType = typeof Input>({
  as,
  name,
  label,
  labelInside = false,
  className,
  ...props
}: PropsWithAsAndRef<FormControlProps, T>) {
  const As = as ?? Input;
  const { error, getInputProps } = useField(name);

  return (
    <div className={clsx`flex flex-col gap-2 ${className}`}>
      {!labelInside && label && <Label htmlFor={name}>{label}</Label>}

      <div className="relative flex items-center gap-2">
        <As id={name} name={name} {...props} {...getInputProps()} invalid={error !== undefined} />

        {labelInside && label && <Label htmlFor={name}>{label}</Label>}

        {error && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 bg-white text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
