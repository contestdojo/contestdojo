/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodTypeDef } from "zod";
import type { EventCustomField } from "./db.server";

import { z } from "zod";

import { mapToObject } from "./utils/array-utils";

function optional<
  T extends z.ZodType<Output, Def, Input>,
  Output = any,
  Def extends ZodTypeDef = ZodTypeDef,
  Input = Output,
>(schema: T, optional: boolean) {
  return optional ? schema.optional() : schema;
}

function customFieldSchema({ type, choices, flags, validationRegex }: EventCustomField, existing?: string) {
  if (type === "file") {
    return existing && !flags.editable ? z.enum([existing]) : optional(z.string(), !flags.required);
  }

  return existing && !flags.editable
    ? z.enum([existing])
    : optional(
        choices
          ? z.enum(choices as [string, ...string[]])
          : validationRegex
            ? z.string().regex(new RegExp(validationRegex))
            : z.string(),
        !flags.required,
      );
}

function customFieldFieldProps({ type, label, helpText, flags }: EventCustomField, existing?: string) {
  return {
    type: type === "file" ? "file" : "text",
    label,
    help: helpText,
    readOnly: existing && !flags.editable,
  };
}

export function customFieldsSchema(customFields: EventCustomField[], existing?: { [key: string]: string | undefined }) {
  return z.object(
    mapToObject(
      customFields.filter((v) => !v.flags.hidden),
      (v) => [v.id, customFieldSchema(v, existing?.[v.id])],
    ),
  );
}

export function customFieldsFieldProps(
  customFields: EventCustomField[],
  existing?: { [key: string]: string | undefined },
) {
  return mapToObject(
    customFields.filter((v) => !v.flags.hidden),
    (v) => [v.id, customFieldFieldProps(v, existing?.[v.id])],
  );
}
