/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ForwardedRef } from "react";

import clsx from "clsx";
import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { className, ...props }: JSX.IntrinsicElements["select"],
  ref: ForwardedRef<HTMLSelectElement>
) {
  return (
    <select
      ref={ref}
      {...props}
      className={clsx`block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
    />
  );
});

export default Select;
