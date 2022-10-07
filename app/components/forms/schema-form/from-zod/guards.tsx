/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type {
  ZodAny,
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodBranded,
  ZodDate,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodEffects,
  ZodEnum,
  ZodFirstPartySchemaTypes as ZFPST,
  ZodFunction,
  ZodIntersection,
  ZodLazy,
  ZodLiteral,
  ZodMap,
  ZodNaN,
  ZodNativeEnum,
  ZodNever,
  ZodNull,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodPromise,
  ZodRecord,
  ZodSet,
  ZodString,
  ZodTuple,
  ZodUndefined,
  ZodUnion,
  ZodUnknown,
  ZodVoid,
} from "zod";

const guards = {
  ZodString: (t: ZFPST): t is ZodString => t._def.typeName === "ZodString",
  ZodNumber: (t: ZFPST): t is ZodNumber => t._def.typeName === "ZodNumber",
  ZodNaN: (t: ZFPST): t is ZodNaN => t._def.typeName === "ZodNaN",
  ZodBigInt: (t: ZFPST): t is ZodBigInt => t._def.typeName === "ZodBigInt",
  ZodBoolean: (t: ZFPST): t is ZodBoolean => t._def.typeName === "ZodBoolean",
  ZodDate: (t: ZFPST): t is ZodDate => t._def.typeName === "ZodDate",
  ZodUndefined: (t: ZFPST): t is ZodUndefined => t._def.typeName === "ZodUndefined",
  ZodNull: (t: ZFPST): t is ZodNull => t._def.typeName === "ZodNull",
  ZodAny: (t: ZFPST): t is ZodAny => t._def.typeName === "ZodAny",
  ZodUnknown: (t: ZFPST): t is ZodUnknown => t._def.typeName === "ZodUnknown",
  ZodNever: (t: ZFPST): t is ZodNever => t._def.typeName === "ZodNever",
  ZodVoid: (t: ZFPST): t is ZodVoid => t._def.typeName === "ZodVoid",
  ZodArray: (t: ZFPST): t is ZodArray<any> => t._def.typeName === "ZodArray",
  ZodObject: (t: ZFPST): t is ZodObject<any> => t._def.typeName === "ZodObject",
  ZodUnion: (t: ZFPST): t is ZodUnion<any> => t._def.typeName === "ZodUnion",
  ZodDiscriminatedUnion: (t: ZFPST): t is ZodDiscriminatedUnion<any, any, any> =>
    t._def.typeName === "ZodDiscriminatedUnion",
  ZodIntersection: (t: ZFPST): t is ZodIntersection<any, any> =>
    t._def.typeName === "ZodIntersection",
  ZodTuple: (t: ZFPST): t is ZodTuple => t._def.typeName === "ZodTuple",
  ZodRecord: (t: ZFPST): t is ZodRecord => t._def.typeName === "ZodRecord",
  ZodMap: (t: ZFPST): t is ZodMap => t._def.typeName === "ZodMap",
  ZodSet: (t: ZFPST): t is ZodSet => t._def.typeName === "ZodSet",
  ZodFunction: (t: ZFPST): t is ZodFunction<any, any> => t._def.typeName === "ZodFunction",
  ZodLazy: (t: ZFPST): t is ZodLazy<any> => t._def.typeName === "ZodLazy",
  ZodLiteral: (t: ZFPST): t is ZodLiteral<any> => t._def.typeName === "ZodLiteral",
  ZodEnum: (t: ZFPST): t is ZodEnum<any> => t._def.typeName === "ZodEnum",
  ZodEffects: (t: ZFPST): t is ZodEffects<any> => t._def.typeName === "ZodEffects",
  ZodNativeEnum: (t: ZFPST): t is ZodNativeEnum<any> => t._def.typeName === "ZodNativeEnum",
  ZodOptional: (t: ZFPST): t is ZodOptional<any> => t._def.typeName === "ZodOptional",
  ZodNullable: (t: ZFPST): t is ZodNullable<any> => t._def.typeName === "ZodNullable",
  ZodDefault: (t: ZFPST): t is ZodDefault<any> => t._def.typeName === "ZodDefault",
  ZodPromise: (t: ZFPST): t is ZodPromise<any> => t._def.typeName === "ZodPromise",
  ZodBranded: (t: ZFPST): t is ZodBranded<any, any> => t._def.typeName === "ZodBranded",
};

export default guards;
