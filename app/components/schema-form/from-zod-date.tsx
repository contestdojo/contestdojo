/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodDate } from "zod";
import type { FromZodProps } from "./from-zod";

import { Input } from "~/components/ui";

import { Field } from "./field";

export function FromZodDate({ name, fieldProps }: FromZodProps<ZodDate>) {
  return <Field className="flex-1" as={Input} type="datetime-local" name={name} {...fieldProps} />;
}
