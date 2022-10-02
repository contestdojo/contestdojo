/* eslint-disable header/header */

/*
 * Copyright (c) 2022 Seasoned Desenvolvimento de Software LTDA.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { ZodTypeAny } from "zod";

type ZodTypeName = "ZodString" | "ZodNumber" | "ZodBoolean" | "ZodDate" | "ZodEnum";

type ShapeInfo = {
  typeName: ZodTypeName | null;
  optional: boolean;
  nullable: boolean;
  getDefaultValue?: () => unknown;
  enumValues?: string[];
};

function shapeInfo(
  shape?: ZodTypeAny,
  optional = false,
  nullable = false,
  getDefaultValue?: ShapeInfo["getDefaultValue"],
  enumValues?: ShapeInfo["enumValues"]
): ShapeInfo {
  if (!shape) {
    return { typeName: null, optional, nullable, getDefaultValue, enumValues };
  }

  const typeName = shape._def.typeName;

  if (typeName === "ZodEffects") {
    return shapeInfo(shape._def.schema, optional, nullable, getDefaultValue, enumValues);
  }

  if (typeName === "ZodOptional") {
    return shapeInfo(shape._def.innerType, true, nullable, getDefaultValue, enumValues);
  }

  if (typeName === "ZodNullable") {
    return shapeInfo(shape._def.innerType, optional, true, getDefaultValue, enumValues);
  }

  if (typeName === "ZodDefault") {
    return shapeInfo(shape._def.innerType, optional, nullable, shape._def.defaultValue, enumValues);
  }

  if (typeName === "ZodEnum") {
    return {
      typeName,
      optional,
      nullable,
      getDefaultValue,
      enumValues: shape._def.values,
    };
  }

  return { typeName, optional, nullable, getDefaultValue, enumValues };
}

export { shapeInfo };
export type { ZodTypeName, ShapeInfo };
