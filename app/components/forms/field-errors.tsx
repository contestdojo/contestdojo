/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";

export default function FieldErrors({ className, ...props }: JSX.IntrinsicElements["div"]) {
  return <div {...props} className={clsx`text-sm text-red-600 ${className}`} />;
}
