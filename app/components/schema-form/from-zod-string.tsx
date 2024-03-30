/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodString } from "zod";
import type { FromZodProps } from "./from-zod";

import { Input, TextArea } from "~/components/ui";

import { Field } from "./field";

export function FromZodString({ name, fieldProps: _fieldProps }: FromZodProps<ZodString>) {
  if (_fieldProps?.hide) return null;

  const { multiline, ...fieldProps } = _fieldProps ?? {};

  if (multiline) {
    return (
      <Field className="flex-1" as={TextArea} type="text" name={name} rows={10} {...fieldProps} />
    );
  } else {
    return <Field className="flex-1" as={Input} type="text" name={name} {...fieldProps} />;
  }
}
