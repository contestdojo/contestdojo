import { z } from "zod";
import { firestore } from "./firebase.server";
import * as zfb from "./zfb.server";

const User = zfb.firestoreObject(
  z.object({
    id: z.string(),
    email: z.string(),
    fname: z.string(),
    lname: z.string(),
    type: z.string(),
  })
);

const Entity = zfb.firestoreObject(
  z.object({
    id: z.string(),
    name: z.string(),
    admins: z.array(zfb.documentReference()),
    stripeAccount: z.string().optional(),
  })
);

const Event = zfb.firestoreObject(
  z.object({
    id: z.string(),
    name: z.string(),
    date: zfb.timestamp(),
    owner: zfb.documentReference(),
    frozen: z.boolean(),
    hide: z.boolean().optional(),
    costPerStudent: z.number().optional(),
    studentsPerTeam: z.number(),
    maxTeams: z.number().optional(),
    scoreReportsAvailable: z.boolean().optional(),
    description: z.string().optional(),
    costDescription: z.string().optional(),
    waiver: z.string().optional(),
  })
);

export type User = z.infer<typeof User>; // eslint-disable-line @typescript-eslint/no-redeclare
export type Entity = z.infer<typeof Entity>; // eslint-disable-line @typescript-eslint/no-redeclare
export type Event = z.infer<typeof Event>; // eslint-disable-line @typescript-eslint/no-redeclare

namespace db {
  export const users = firestore.collection("users").withConverter(User.converter);
  export const entities = firestore.collection("entities").withConverter(Entity.converter);
  export const events = firestore.collection("events").withConverter(Event.converter);

  export function user(id: string) {
    return users.doc(id).withConverter(User.converter);
  }

  export function entity(id: string) {
    return entities.doc(id).withConverter(Entity.converter);
  }

  export function event(id: string) {
    return events.doc(id).withConverter(Event.converter);
  }
}

export default db;
