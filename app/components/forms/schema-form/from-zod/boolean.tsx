/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodBoolean } from "zod";
import type { FromZodProps } from "~/components/forms/schema-form/from-zod";

import Checkbox from "~/components/forms/checkbox";
import Field from "~/components/forms/schema-form/field";

export default function FromZodBoolean({ name, fieldProps }: FromZodProps<ZodBoolean>) {
  return <Field as={Checkbox} type="checkbox" name={name} {...fieldProps} />;
}
