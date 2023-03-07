/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ZodAny, ZodArray, ZodBigInt, ZodBoolean, ZodBranded, ZodDate, ZodDefault, ZodDiscriminatedUnion, ZodEffects, ZodEnum, ZodFirstPartySchemaTypes as ZFPST, ZodFunction, ZodIntersection, ZodLazy, ZodLiteral, ZodMap, ZodNaN, ZodNativeEnum, ZodNever, ZodNull, ZodNullable, ZodNumber, ZodObject, ZodOptional, ZodPromise, ZodRecord, ZodSet, ZodString, ZodTuple, ZodUndefined, ZodUnion, ZodUnknown, ZodVoid } from "zod";
import type { FromZodProps } from "./from-zod";

export const guardType = {
  ZodString: (type: ZFPST): type is ZodString => type._def.typeName === "ZodString",
  ZodNumber: (type: ZFPST): type is ZodNumber => type._def.typeName === "ZodNumber",
  ZodNaN: (type: ZFPST): type is ZodNaN => type._def.typeName === "ZodNaN",
  ZodBigInt: (type: ZFPST): type is ZodBigInt => type._def.typeName === "ZodBigInt",
  ZodBoolean: (type: ZFPST): type is ZodBoolean => type._def.typeName === "ZodBoolean",
  ZodDate: (type: ZFPST): type is ZodDate => type._def.typeName === "ZodDate",
  ZodUndefined: (type: ZFPST): type is ZodUndefined => type._def.typeName === "ZodUndefined",
  ZodNull: (type: ZFPST): type is ZodNull => type._def.typeName === "ZodNull",
  ZodAny: (type: ZFPST): type is ZodAny => type._def.typeName === "ZodAny",
  ZodUnknown: (type: ZFPST): type is ZodUnknown => type._def.typeName === "ZodUnknown",
  ZodNever: (type: ZFPST): type is ZodNever => type._def.typeName === "ZodNever",
  ZodVoid: (type: ZFPST): type is ZodVoid => type._def.typeName === "ZodVoid",
  ZodArray: (type: ZFPST): type is ZodArray<any> => type._def.typeName === "ZodArray",
  ZodObject: (type: ZFPST): type is ZodObject<any> => type._def.typeName === "ZodObject",
  ZodUnion: (type: ZFPST): type is ZodUnion<any> => type._def.typeName === "ZodUnion",
  ZodDiscriminatedUnion: (type: ZFPST): type is ZodDiscriminatedUnion<any, any> => type._def.typeName === "ZodDiscriminatedUnion",
  ZodIntersection: (type: ZFPST): type is ZodIntersection<any, any> => type._def.typeName === "ZodIntersection",
  ZodTuple: (type: ZFPST): type is ZodTuple => type._def.typeName === "ZodTuple",
  ZodRecord: (type: ZFPST): type is ZodRecord => type._def.typeName === "ZodRecord",
  ZodMap: (type: ZFPST): type is ZodMap => type._def.typeName === "ZodMap",
  ZodSet: (type: ZFPST): type is ZodSet => type._def.typeName === "ZodSet",
  ZodFunction: (type: ZFPST): type is ZodFunction<any, any> => type._def.typeName === "ZodFunction",
  ZodLazy: (type: ZFPST): type is ZodLazy<any> => type._def.typeName === "ZodLazy",
  ZodLiteral: (type: ZFPST): type is ZodLiteral<any> => type._def.typeName === "ZodLiteral",
  ZodEnum: (type: ZFPST): type is ZodEnum<any> => type._def.typeName === "ZodEnum",
  ZodEffects: (type: ZFPST): type is ZodEffects<any> => type._def.typeName === "ZodEffects",
  ZodNativeEnum: (type: ZFPST): type is ZodNativeEnum<any> => type._def.typeName === "ZodNativeEnum",
  ZodOptional: (type: ZFPST): type is ZodOptional<any> => type._def.typeName === "ZodOptional",
  ZodNullable: (type: ZFPST): type is ZodNullable<any> => type._def.typeName === "ZodNullable",
  ZodDefault: (type: ZFPST): type is ZodDefault<any> => type._def.typeName === "ZodDefault",
  ZodPromise: (type: ZFPST): type is ZodPromise<any> => type._def.typeName === "ZodPromise",
  ZodBranded: (type: ZFPST): type is ZodBranded<any, any> => type._def.typeName === "ZodBranded",
};

export const guardProps = {
  ZodString: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodString> => guardType.ZodString(props.type),
  ZodNumber: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodNumber> => guardType.ZodNumber(props.type),
  ZodNaN: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodNaN> => guardType.ZodNaN(props.type),
  ZodBigInt: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodBigInt> => guardType.ZodBigInt(props.type),
  ZodBoolean: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodBoolean> => guardType.ZodBoolean(props.type),
  ZodDate: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodDate> => guardType.ZodDate(props.type),
  ZodUndefined: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodUndefined> => guardType.ZodUndefined(props.type),
  ZodNull: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodNull> => guardType.ZodNull(props.type),
  ZodAny: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodAny> => guardType.ZodAny(props.type),
  ZodUnknown: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodUnknown> => guardType.ZodUnknown(props.type),
  ZodNever: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodNever> => guardType.ZodNever(props.type),
  ZodVoid: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodVoid> => guardType.ZodVoid(props.type),
  ZodArray: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodArray<any>> => guardType.ZodArray(props.type),
  ZodObject: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodObject<any>> => guardType.ZodObject(props.type),
  ZodUnion: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodUnion<any>> => guardType.ZodUnion(props.type),
  ZodDiscriminatedUnion: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodDiscriminatedUnion<any, any>> => guardType.ZodDiscriminatedUnion(props.type),
  ZodIntersection: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodIntersection<any, any>> => guardType.ZodIntersection(props.type),
  ZodTuple: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodTuple> => guardType.ZodTuple(props.type),
  ZodRecord: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodRecord> => guardType.ZodRecord(props.type),
  ZodMap: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodMap> => guardType.ZodMap(props.type),
  ZodSet: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodSet> => guardType.ZodSet(props.type),
  ZodFunction: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodFunction<any, any>> => guardType.ZodFunction(props.type),
  ZodLazy: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodLazy<any>> => guardType.ZodLazy(props.type),
  ZodLiteral: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodLiteral<any>> => guardType.ZodLiteral(props.type),
  ZodEnum: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodEnum<any>> => guardType.ZodEnum(props.type),
  ZodEffects: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodEffects<any>> => guardType.ZodEffects(props.type),
  ZodNativeEnum: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodNativeEnum<any>> => guardType.ZodNativeEnum(props.type),
  ZodOptional: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodOptional<any>> => guardType.ZodOptional(props.type),
  ZodNullable: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodNullable<any>> => guardType.ZodNullable(props.type),
  ZodDefault: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodDefault<any>> => guardType.ZodDefault(props.type),
  ZodPromise: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodPromise<any>> => guardType.ZodPromise(props.type),
  ZodBranded: (props: FromZodProps<ZFPST>): props is FromZodProps<ZodBranded<any, any>> => guardType.ZodBranded(props.type),
};
