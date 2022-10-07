/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodObject, ZodRawShape } from "zod";
import type { FromZodProps } from "~/components/forms/schema-form/from-zod";

import FromZod from "~/components/forms/schema-form/from-zod";

export function FromZodObject<S extends ZodRawShape, T extends ZodObject<S>>({
  name,
  type,
  fieldProps,
}: Omit<FromZodProps<T>, "name"> & { name?: string }) {
  const items = Object.entries(type.shape);

  return (
    <>
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
}
