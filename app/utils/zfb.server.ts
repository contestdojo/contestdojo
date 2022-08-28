import type { FirestoreDataConverter, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { DocumentReference, Timestamp } from "firebase-admin/firestore";
import type { extendShape, ZodObject, ZodRawShape, ZodString } from "zod";
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
      toFirestore: (data: z.infer<S>) => data,
      fromFirestore: (snapshot: QueryDocumentSnapshot) =>
        schema.parse({ ...snapshot.data(), id: snapshot.id }) as z.infer<S>,
    },
  };
};

export const documentReference = () =>
  z.custom<DocumentReference>((data) => data instanceof DocumentReference);

export const timestamp = () => z.custom<Timestamp>((data) => data instanceof Timestamp);
