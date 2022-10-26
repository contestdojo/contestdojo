/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";

export type LabelProps = JSX.IntrinsicElements["label"];

export function Label({ className, ...props }: LabelProps) {
  return (
    <label {...props} className={clsx`block text-sm font-medium text-gray-700 ${className}`} />
  );
}
