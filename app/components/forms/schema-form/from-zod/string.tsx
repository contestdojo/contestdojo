/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodString } from "zod";
import type { FromZodProps } from "~/components/forms/schema-form/from-zod";

import Input from "~/components/forms/input";
import Field from "~/components/forms/schema-form/field";

export default function FromZodString({ name, fieldProps }: FromZodProps<ZodString>) {
  return <Field className="flex-1" as={Input} type="text" name={name} {...fieldProps} />;
}
