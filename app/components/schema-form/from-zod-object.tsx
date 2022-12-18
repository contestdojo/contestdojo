/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodObject, ZodRawShape } from "zod";
import type { FieldProps, FromZodProps } from "./from-zod";

import { twMerge } from "tailwind-merge";

import { Label } from "../ui";
import { FromZod } from "./from-zod";

export type ZodObjectFieldProps<T extends ZodObject<ZodRawShape>> = {
  [key in keyof T["shape"]]?: FieldProps<T["shape"][key]>;
} & {
  __label?: string;
  __className?: string;
};

export function FromZodObject<T extends ZodObject<ZodRawShape>>({
  name,
  type,
  fieldProps,
}: Omit<FromZodProps<T>, "name"> & { name?: string }) {
  const items = Object.entries(type.shape);

  const elements = (
    <>
      {fieldProps?.__label && <Label>{fieldProps.__label}</Label>}
      {items.map(([itemName, itemType]) => {
        return (
          <FromZod
            key={itemName}
            name={name ? `${name}.${itemName}` : itemName}
            fieldProps={fieldProps?.[itemName]}
            type={itemType}
          />
        );
      })}
    </>
  );

  if (fieldProps?.__className) {
    return <div className={twMerge("flex flex-col gap-5", fieldProps.__className)}>{elements}</div>;
  }

  return elements;
}
