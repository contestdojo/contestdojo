/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodOptional, ZodTypeAny } from "zod";
import type { FromZodProps } from "./from-zod";

import { FromZod } from "./from-zod";

export function FromZodOptional<T extends ZodTypeAny>({
  type,
  ...props
}: FromZodProps<ZodOptional<T>>) {
  return <FromZod type={type.unwrap()} {...props} />;
}
