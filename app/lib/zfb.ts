/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { FirestoreDataConverter, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { ZodObject, ZodRawShape, ZodString } from "zod";

import { z } from "zod";

export const firestoreObject = <T extends ZodRawShape & { id: ZodString }, S extends ZodObject<T>>(
  schema: S
): S & { converter: FirestoreDataConverter<z.infer<S>> } => {
  return {
    ...schema,
    converter: {
      toFirestore: (data: never) => {
        throw new Error("Unimplemented");
      },
      fromFirestore: (snapshot: QueryDocumentSnapshot) =>
        schema.parse({ ...snapshot.data(), id: snapshot.id }) as z.infer<S>,
    },
  };
};

export class UnifiedDocumentReference {
  readonly path: string;
  readonly id: string;

  constructor(path: string) {
    const id = path.split("/").pop();
    if (!id) throw new TypeError("Path must contain a forward slash");
    this.path = path;
    this.id = id;
  }
}

function hasPath(x: unknown): x is { path: unknown } {
  return typeof x === "object" && x !== null && "path" in x;
}

export const documentReference = () =>
  z.preprocess((x) => {
    if (hasPath(x) && typeof x.path === "string") return new UnifiedDocumentReference(x.path);
    if (typeof x === "string") return new UnifiedDocumentReference(x);
  }, z.instanceof(UnifiedDocumentReference));
