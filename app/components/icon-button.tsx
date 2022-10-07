/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithAs } from "~/lib/utils/props-with-as";

export default function IconButton<T extends React.ElementType = "button">({
  as,
  className,
  ...props
}: PropsWithAs<{}, T>) {
  const As = as ?? "button";

  return (
    <As
      className={`-m-1 rounded-full border border-transparent p-1 text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      {...props}
    />
  );
}
