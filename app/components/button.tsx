/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithAs } from "~/utils/props-with-as";

import React from "react";

type ButtonProps = JSX.IntrinsicElements["button"];

export default function Button<T extends React.ElementType = "button">({
  as,
  ...props
}: PropsWithAs<ButtonProps, T>) {
  const As = as ?? "button";

  return (
    <As
      {...props}
      className="flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    />
  );
}
