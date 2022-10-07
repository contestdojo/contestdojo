/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodDate } from "zod";
import type { FromZodProps } from "~/components/forms/schema-form/from-zod";

import FormControl from "~/components/forms/form-control";
import Input from "~/components/forms/input";

export default function FromZodDate({ name, fieldProps }: FromZodProps<ZodDate>) {
  return <FormControl className="flex-1" as={Input} type="date" name={name} {...fieldProps} />;
}
