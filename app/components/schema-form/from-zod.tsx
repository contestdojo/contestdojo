/*
 * Copyright (c) 2024 Oliver Ni
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
  ZodRawShape,
  ZodString,
  ZodType as ZodTypeAny,
} from "zod";
import type { FormControlProps } from "~/components/ui";
import type { ArrayFieldProps } from "./from-zod-array";
import type { ZodObjectFieldProps } from "./from-zod-object";

import { Alert, AlertStatus } from "~/components/ui";

import { FromZodArray } from "./from-zod-array";
import { FromZodBoolean } from "./from-zod-boolean";
import { FromZodDate } from "./from-zod-date";
import { FromZodEffects } from "./from-zod-effects";
import { FromZodEnum } from "./from-zod-enum";
import { FromZodNullable } from "./from-zod-nullable";
import { FromZodNumber } from "./from-zod-number";
import { FromZodObject } from "./from-zod-object";
import { FromZodOptional } from "./from-zod-optional";
import { FromZodString } from "./from-zod-string";
import { FromZodUnion } from "./from-zod-union";
import { guardProps } from "./guards";

type BaseFieldProps = Partial<FormControlProps<any>>;

// prettier-ignore
export type FieldProps<T extends ZodTypeAny> =
    T extends ZodObject<ZodRawShape> ? ZodObjectFieldProps<T>
  : T extends ZodArray<ZodTypeAny>   ? ArrayFieldProps<T>
  : T extends ZodEffects<infer U>    ? FieldProps<U>
  : T extends ZodOptional<infer U>   ? FieldProps<U>
  : T extends ZodString              ? BaseFieldProps & { hide?: boolean; multiline?: boolean }
  : BaseFieldProps

export type FromZodProps<T extends ZodTypeAny> = {
  name: string;
  type: T;
  fieldProps?: FieldProps<T>;
};

export function FromZod(props: FromZodProps<ZodFirstPartySchemaTypes>) {
  if (guardProps.ZodString(props)) return <FromZodString {...props} />;
  if (guardProps.ZodNumber(props)) return <FromZodNumber {...props} />;
  if (guardProps.ZodBoolean(props)) return <FromZodBoolean {...props} />;
  if (guardProps.ZodDate(props)) return <FromZodDate {...props} />;
  if (guardProps.ZodArray(props)) return <FromZodArray {...props} />;
  if (guardProps.ZodObject(props)) return <FromZodObject {...props} />;
  if (guardProps.ZodUnion(props)) return <FromZodUnion {...props} />;
  if (guardProps.ZodEnum(props)) return <FromZodEnum {...props} />;
  if (guardProps.ZodEffects(props)) return <FromZodEffects {...props} />;
  if (guardProps.ZodOptional(props)) return <FromZodOptional {...props} />;
  if (guardProps.ZodNullable(props)) return <FromZodNullable {...props} />;

  return (
    <Alert status={AlertStatus.Error} title="Error">
      Unimplemented field type: {props.type._def.typeName}
    </Alert>
  );
}
