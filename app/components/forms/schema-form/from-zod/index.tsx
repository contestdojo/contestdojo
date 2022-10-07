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
  ZodRawShape,
  ZodType as ZodTypeAny,
} from "zod";
import type { FormControlProps } from "~/components/forms/form-control";
import type { ArrayFieldProps } from "~/components/forms/schema-form/from-zod/array";
import type { ZodObjectFieldProps } from "~/components/forms/schema-form/from-zod/object";

import Alert, { Status } from "~/components/alert";
import { FromZodArray } from "~/components/forms/schema-form/from-zod/array";
import FromZodBoolean from "~/components/forms/schema-form/from-zod/boolean";
import FromZodDate from "~/components/forms/schema-form/from-zod/date";
import { FromZodEffects } from "~/components/forms/schema-form/from-zod/effects";
import { guardProps } from "~/components/forms/schema-form/from-zod/guards";
import FromZodNumber from "~/components/forms/schema-form/from-zod/number";
import { FromZodObject } from "~/components/forms/schema-form/from-zod/object";
import { FromZodOptional } from "~/components/forms/schema-form/from-zod/optional";
import FromZodString from "~/components/forms/schema-form/from-zod/string";
import FromZodUnion from "~/components/forms/schema-form/from-zod/union";

// prettier-ignore
export type FieldProps<T extends ZodTypeAny> =
    T extends ZodObject<ZodRawShape> ? ZodObjectFieldProps<T>
  : T extends ZodArray<ZodTypeAny>   ? ArrayFieldProps<T>
  : T extends ZodEffects<infer U>    ? FieldProps<U>
  : T extends ZodOptional<infer U>   ? FieldProps<U>
  : Partial<FormControlProps<any>>;

export type FromZodProps<T extends ZodTypeAny> = {
  name: string;
  type: T;
  fieldProps?: FieldProps<T>;
};

export default function FromZod(props: FromZodProps<ZodFirstPartySchemaTypes>) {
  if (guardProps.ZodString(props)) return <FromZodString {...props} />;
  if (guardProps.ZodNumber(props)) return <FromZodNumber {...props} />;
  if (guardProps.ZodBoolean(props)) return <FromZodBoolean {...props} />;
  if (guardProps.ZodDate(props)) return <FromZodDate {...props} />;
  if (guardProps.ZodArray(props)) return <FromZodArray {...props} />;
  if (guardProps.ZodObject(props)) return <FromZodObject {...props} />;
  if (guardProps.ZodUnion(props)) return <FromZodUnion {...props} />;
  if (guardProps.ZodEffects(props)) return <FromZodEffects {...props} />;
  if (guardProps.ZodOptional(props)) return <FromZodOptional {...props} />;

  return (
    <Alert status={Status.Error} title="Error">
      Unimplemented field type: {props.type._def.typeName}
    </Alert>
  );
}
