/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithAs } from "~/lib/utils/props-with-as";

import clsx from "clsx";
import React from "react";

export function Button<T extends React.ElementType = "button">({
  as,
  className,
  ...props
}: PropsWithAs<{}, T>) {
  const As = as ?? "button";

  return (
    <As
      {...props}
      className={clsx`flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-blue-600 ${className}`}
    />
  );
}
