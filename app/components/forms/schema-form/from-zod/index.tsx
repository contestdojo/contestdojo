/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type {
  ZodArray,
  ZodEffects,
  ZodFirstPartySchemaTypes,
  ZodObject,
  ZodOptional,
  ZodType as ZodTypeAny,
} from "zod";
import type { FormControlProps } from "~/components/forms/form-control";

import Alert, { Status } from "~/components/alert";
import { FromZodArray } from "~/components/forms/schema-form/from-zod/array";
import FromZodBoolean from "~/components/forms/schema-form/from-zod/boolean";
import FromZodDate from "~/components/forms/schema-form/from-zod/date";
import { FromZodEffects } from "~/components/forms/schema-form/from-zod/effects";
import guards from "~/components/forms/schema-form/from-zod/guards";
import FromZodNumber from "~/components/forms/schema-form/from-zod/number";
import { FromZodObject } from "~/components/forms/schema-form/from-zod/object";
import { FromZodOptional } from "~/components/forms/schema-form/from-zod/optional";
import FromZodString from "~/components/forms/schema-form/from-zod/string";
import FromZodUnion from "~/components/forms/schema-form/from-zod/union";

export type FieldProps<T extends ZodTypeAny> = T extends ZodObject<infer S>
  ? { [key in keyof T["shape"]]?: FieldProps<S[key]> }
  : T extends ZodArray<infer U>
  ? FieldProps<U> & { __parent?: { label: string }; __element?: { className: string } }
  : T extends ZodEffects<infer U>
  ? FieldProps<U>
  : T extends ZodOptional<infer U>
  ? FieldProps<U>
  : Partial<FormControlProps<any>>;

export type FromZodProps<T extends ZodTypeAny> = {
  name: string;
  type: T;
  fieldProps?: FieldProps<T>;
};

export default function FromZod<T extends ZodFirstPartySchemaTypes>({
  type,
  ...props
}: FromZodProps<T>) {
  if (guards.ZodString(type)) return <FromZodString type={type} {...props} />;
  if (guards.ZodNumber(type)) return <FromZodNumber type={type} {...props} />;
  if (guards.ZodBoolean(type)) return <FromZodBoolean type={type} {...props} />;
  if (guards.ZodDate(type)) return <FromZodDate type={type} {...props} />;
  if (guards.ZodArray(type)) return <FromZodArray type={type} {...props} />;
  if (guards.ZodObject(type)) return <FromZodObject type={type} {...props} />;
  if (guards.ZodUnion(type)) return <FromZodUnion type={type} {...props} />;
  if (guards.ZodEffects(type)) return <FromZodEffects type={type} {...props} />;
  if (guards.ZodOptional(type)) return <FromZodOptional type={type} {...props} />;

  return (
    <Alert status={Status.Error} title="Error">
      Unimplemented field type: {type._def.typeName}
    </Alert>
  );
}
