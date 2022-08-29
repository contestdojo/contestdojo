/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { FirestoreDataConverter, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { extendShape, ZodObject, ZodRawShape, ZodString } from "zod";

import { DocumentReference, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

export const firestoreObject = <
  T extends extendShape<ZodRawShape, { id: ZodString }>,
  S extends ZodObject<T>
>(
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

export type DocumentReferenceInfo = { path: string; id: string };

export const documentReference = () =>
  z
    .custom<DocumentReference>((data) => data instanceof DocumentReference)
    .transform<DocumentReferenceInfo>((x) => ({ path: x.path, id: x.id }));

export const timestamp = () => z.custom<Timestamp>((data) => data instanceof Timestamp);
