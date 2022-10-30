/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodEnum } from "zod";
import type { FromZodProps } from "./from-zod";

import { Select } from "~/components/ui";

import { Field } from "./field";

export function FromZodEnum({
  name,
  type,
  fieldProps,
}: FromZodProps<ZodEnum<[string, ...string[]]>>) {
  return (
    <Field className="flex-1" as={Select} name={name} {...fieldProps}>
      {type.options.map((x) => (
        <option key={x} value={x}>
          {x}
        </option>
      ))}
    </Field>
  );
}
