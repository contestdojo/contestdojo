/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { FieldValue, UpdateData } from "firebase-admin/firestore";

import * as firebase from "firebase-admin";
import { z } from "zod";

import { firestore } from "~/lib/firebase.server";
import * as zfb from "~/lib/zfb.server";

const User = zfb.firestoreObject(
  z.object({
    id: z.string(),
    email: z.string(),
    fname: z.string(),
    lname: z.string(),
    type: z.string(),
  })
);

const Organization = zfb.firestoreObject(
  z.object({
    id: z.string(),
    name: z.string(),
    admin: zfb.documentReference(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zip: z.string(),
    adminData: z.object({
      email: z.string(),
      fname: z.string(),
      lname: z.string(),
      type: z.string(),
    }),
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

const EventCustomField = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean(),
  choices: z.array(z.string()).optional().nullable(),
  hidden: z.boolean().optional(),
});

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
    customFields: z.array(EventCustomField).optional(),
  })
);

const EventOrganization = zfb.firestoreObject(
  z.object({
    id: z.string(),
    maxStudents: z.number().optional(),
    notes: z.string().optional(),
  })
);

const EventStudent = zfb.firestoreObject(
  z.object({
    id: z.string(),
    email: z.string(),
    fname: z.string(),
    lname: z.string(),
    grade: z.number().optional(),
    user: zfb.documentReference(),
    org: zfb.documentReference(),
    team: zfb.documentReference().optional().nullable(),
    number: z.string().optional(),
    waiver: z.string().optional(),
    notes: z.string().optional(),
    customFields: z.any().optional(),
  })
);

const EventTeam = zfb.firestoreObject(
  z.object({
    id: z.string(),
    name: z.string(),
    org: zfb.documentReference(),
    number: z.string().optional(),
    scoreReport: z.string().optional(),
    notes: z.string().optional(),
  })
);

export type User = z.infer<typeof User>; // eslint-disable-line @typescript-eslint/no-redeclare
export type Entity = z.infer<typeof Entity>; // eslint-disable-line @typescript-eslint/no-redeclare
export type EventCustomField = z.infer<typeof EventCustomField>; // eslint-disable-line @typescript-eslint/no-redeclare
export type Event = z.infer<typeof Event>; // eslint-disable-line @typescript-eslint/no-redeclare
export type Organization = z.infer<typeof Organization>; // eslint-disable-line @typescript-eslint/no-redeclare
export type EventOrganization = z.infer<typeof EventOrganization>; // eslint-disable-line @typescript-eslint/no-redeclare
export type EventStudent = z.infer<typeof EventStudent>; // eslint-disable-line @typescript-eslint/no-redeclare
export type EventTeam = z.infer<typeof EventTeam>; // eslint-disable-line @typescript-eslint/no-redeclare

namespace db {
  // Collections

  export const users = firestore.collection("users").withConverter(User.converter);
  export const orgs = firestore.collection("orgs").withConverter(Organization.converter);
  export const entities = firestore.collection("entities").withConverter(Entity.converter);
  export const events = firestore.collection("events").withConverter(Event.converter);

  export function eventOrgs(eventId: string) {
    return events.doc(eventId).collection("orgs").withConverter(EventOrganization.converter);
  }

  export function eventStudents(eventId: string) {
    return events.doc(eventId).collection("students").withConverter(EventStudent.converter);
  }

  export function eventTeams(eventId: string) {
    return events.doc(eventId).collection("teams").withConverter(EventTeam.converter);
  }

  // Documents

  export function user(id: string) {
    return users.doc(id).withConverter(User.converter);
  }

  export function org(id: string) {
    return orgs.doc(id).withConverter(Organization.converter);
  }

  export function entity(id: string) {
    return entities.doc(id).withConverter(Entity.converter);
  }

  export function event(id: string) {
    return events.doc(id).withConverter(Event.converter);
  }

  export function eventOrg(eventId: string, id: string) {
    return eventOrgs(eventId).doc(id).withConverter(EventOrganization.converter);
  }

  export function eventStudent(eventId: string, id: string) {
    return eventStudents(eventId).doc(id).withConverter(EventStudent.converter);
  }

  export function eventTeam(eventId: string, id: string) {
    return eventTeams(eventId).doc(id).withConverter(EventTeam.converter);
  }

  // Utils

  export namespace util {
    type Stupid<T> = { [K in keyof UpdateData<T>]: UpdateData<T>[K] | FieldValue };

    export function mapUndefinedToDelete<T extends {}>(update: Stupid<T>): Stupid<T> {
      for (const key in update) {
        if (update[key] === undefined) {
          update[key] = firebase.firestore.FieldValue.delete();
        }
      }
      return update;
    }
  }
}

export default db;
