/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodTypeAny, ZodUnion } from "zod";
import type { FromZodProps } from "./from-zod";

import { useMemo } from "react";

import { Checkbox, Input } from "~/components/ui";

import { Field } from "./field";
import { guardType } from "./guards";

type ZodUnionOptions = Readonly<[ZodTypeAny, ...ZodTypeAny[]]>;

function isZfdCheckbox<T extends ZodUnionOptions>(type: ZodUnion<T>) {
  const ctx = { addIssue: () => {}, path: [] };

  if (
    type.options.length === 2 &&
    guardType.ZodEffects(type.options[0]) &&
    guardType.ZodEffects(type.options[1]) &&
    type.options[0]._def.effect.type === "transform" &&
    type.options[1]._def.effect.type === "transform" &&
    type.options[0]._def.effect.transform(undefined, ctx) === true &&
    type.options[1]._def.effect.transform(undefined, ctx) === false
  ) {
    const two = type.options[1].innerType();
    return guardType.ZodLiteral(two) && two.value === undefined;
  }

  return false;
}

export function FromZodUnion<T extends ZodUnionOptions>({
  name,
  fieldProps,
  type,
}: FromZodProps<ZodUnion<T>>) {
  const isCheckbox = useMemo(() => isZfdCheckbox(type), [type]);

  if (isCheckbox) {
    return <Field as={Checkbox} type="checkbox" name={name} {...fieldProps} />;
  }

  return <Field className="flex-1" as={Input} type="text" name={name} {...fieldProps} />;
}
