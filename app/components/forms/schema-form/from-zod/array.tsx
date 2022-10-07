/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodArray, ZodTypeAny } from "zod";
import type { FromZodProps } from "~/components/forms/schema-form/from-zod";

import FromZod from "~/components/forms/schema-form/from-zod";

export function FromZodArray<T extends ZodTypeAny>({
  name,
  fieldProps,
  type,
}: FromZodProps<ZodArray<T>>) {
  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row">
        <FromZod name={`${name}[0]`} fieldProps={fieldProps} type={type.element} />
      </div>
      {/* <Button className="self-start" type="button">
        Add Item
      </Button> */}
    </>
  );
}
