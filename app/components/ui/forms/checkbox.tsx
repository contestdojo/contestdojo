/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ForwardedRef } from "react";

import clsx from "clsx";
import { forwardRef } from "react";

type CheckboxProps = JSX.IntrinsicElements["input"] & {
  invalid?: boolean;
};

export const Checkbox = forwardRef(function Checkbox(
  { className, invalid = false, ...props }: CheckboxProps,
  ref: ForwardedRef<HTMLInputElement>
) {
  return (
    <input
      ref={ref}
      {...props}
      className={clsx`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
        invalid && "border-red-300 focus:border-red-500 focus:ring-red-500"
      } ${className}`}
    />
  );
});
