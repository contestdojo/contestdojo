/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Transaction } from "firebase-admin/firestore";
import type { User } from "./auth.server";

import { db } from "~/lib/db.server";
import { firestore } from "~/lib/firebase.server";
import sendgrid from "~/lib/sendgrid.server";

import { mapToObject } from "./utils/array-utils";

// TODO: Refactor this file.

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export async function checkIn(
  user: User,
  eventId: string,
  teams: { [teamId: string]: "__skip__" | "__auto__" | string },
  allowIncompleteWaivers: boolean = false
) {
  const eventRef = db.event(eventId);

  const eventSnap = await eventRef.get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });
  if (!event.checkInPools) throw new Error("Event does not have check-in pools set up.");
  const checkInPools = event.checkInPools;

  const transactionFunc = async (t: Transaction) => {
    const pools = await Promise.all(
      checkInPools.map(async (x) => ({
        id: x.id,
        maxStudents: x.maxStudents ?? Infinity,
        numStudents: (
          await t.get(db.eventStudents(eventRef.id).where("checkInPool", "==", x.id).count())
        ).data().count,
      }))
    );

    let query = db.eventTeams(eventRef.id).where("number", "!=", "").orderBy("number", "desc");
    const allTeams = await t.get(query).then((x) => x.docs.map((y) => y.data()));
    const allTeamsById = mapToObject(allTeams, (x) => [x.id, x]);
    let nextNumber = allTeams.map((x) => Number(x.number)).find((x) => !isNaN(x)) ?? 0;
    nextNumber++;

    const entries = Object.entries(teams).filter(([id]) => !(id in allTeamsById));
    const allStudents = await Promise.all(
      entries.map(([id]) =>
        t.get(db.eventStudents(eventRef.id).where("team", "==", db.eventTeam(eventRef.id, id)))
      )
    );

    const _orgIds = await Promise.all(entries.map(([id]) => t.get(db.eventTeam(eventRef.id, id))));
    const orgIds = _orgIds.map((x) => x.data()?.org?.id).filter(Boolean);
    const teamIds = entries.map(([id]) => id);

    const zipped = entries.map(([id, poolId], i) => ({
      id,
      poolId,
      students: allStudents[i],
    }));

    for (let { id, poolId, students } of zipped) {
      if (poolId === "__skip__" || students.docs.length === 0) continue;

      if (poolId === "__auto__") {
        // Choose either the pool with the most capacity left, or one that matches exactly
        // prettier-ignore
        poolId = pools.reduce((a, b) =>
            a.maxStudents - a.numStudents === students.docs.length ? a
          : b.maxStudents - b.numStudents === students.docs.length ? b
          : a.maxStudents - a.numStudents > b.maxStudents - b.numStudents ? a
          : b
        ).id;
      }

      const number = String(nextNumber++).padStart(3, "0");
      const pool = pools.find((x) => x.id === poolId);
      const taken = new Set(
        students.docs
          .map((x) => x.data().number)
          .map((x) => x?.startsWith(number) && x[x.length - 1])
          .filter(Boolean)
      );

      if (!pool) throw new Error("Invalid check-in pool provided.");
      if (
        pool.maxStudents !== undefined &&
        pool.maxStudents < (pool.numStudents ?? 0) + students.docs.length
      ) {
        throw new Error("Pool would exceed maximum capacity.");
      }

      t.update(db.eventTeam(eventRef.id, id), {
        number,
        checkInPool: poolId,
      });

      for (const student of students.docs) {
        if (!student.data().waiver && event.waiver && !allowIncompleteWaivers)
          throw new Error(
            `Student ${student.data().fname} ${student.data().lname} has not signed waiver.`
          );

        const letter = alphabet.find((x) => !taken.has(x));
        t.update(student.ref, { number: `${number}${letter}`, checkInPool: poolId });
        taken.add(letter);
      }

      pool.numStudents += students.docs.length;
    }

    t.update(eventRef, { checkInPools: pools });

    return [new Set(orgIds as string[]), new Set(teamIds as string[])];
  };

  let orgIds: Set<string>;
  let teamIds: Set<string>;

  [orgIds, teamIds] = await firestore.runTransaction(transactionFunc);

  try {
    await Promise.all(
      [...orgIds].map(async (x) => {
        const org = await db.org(x).get();
        const orgData = org.data();
        if (!orgData) return;

        const teams = await db.eventTeams(eventRef.id).where("org", "==", db.org(x)).get();
        const students = await db.eventStudents(eventRef.id).where("org", "==", db.org(x)).get();

        const teamsCheckedIn = teams.docs.filter((x) => teamIds.has(x.id));

        if (event.checkInWebhookUrl) {
          const numbers = teamsCheckedIn.map((x) => x.data().number).join(", ");
          await fetch(event.checkInWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              embeds: [
                {
                  author: { name: user.displayName },
                  title: "Checked In Teams",
                  fields: [{ name: orgData.name, value: numbers }],
                  color: 0xf40808,
                },
              ],
            }),
          });
        }

        const teamsText = teams.docs
          .map((x) => x.data())
          .map((x) =>
            x.checkInPool
              ? `[${x.number}] ${x.name} — ${x.checkInPool}`
              : `${x.name} — Not Checked In`
          )
          .join("\n");

        const studentsText = students.docs
          .map((x) => x.data())
          .map((x) =>
            x.checkInPool
              ? `[${x.number}] ${x.fname} ${x.lname} — ${x.checkInPool}`
              : `${x.fname} ${x.lname} — Not Checked In`
          )
          .join("\n");

        await sendgrid.send({
          to: org.data()?.adminData.email,
          from: "noreply@contestdojo.com",
          templateId: "d-1d624e07ec5b4930824eecc1e28007e1",
          dynamicTemplateData: {
            event: event.name,
            org: orgData.name,
            text: "Teams:\n\n" + teamsText + "\n\nStudents:\n\n" + studentsText,
          },
        });
      })
    );
  } catch (e) {
    console.error(e);
  }
}
