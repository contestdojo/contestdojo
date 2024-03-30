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

type BoxProps = {
  hoverEffect?: boolean;
  focusEffect?: boolean;
  className?: string;
};

export function Box<T extends React.ElementType = "div">({
  as,
  hoverEffect = false,
  focusEffect = false,
  className,
  ...props
}: PropsWithAs<BoxProps, T>) {
  const As = as ?? "div";

  return (
    <As
      {...props}
      className={clsx`relative rounded-lg border border-gray-300 bg-white p-4 shadow-sm ${
        hoverEffect && "hover:border-gray-400"
      } ${
        focusEffect && "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      } ${className}`}
    />
  );
}
