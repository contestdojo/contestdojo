/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { User } from "./auth.server";
import type { EventTeam } from "~/lib/db.server";

import { FieldPath, FieldValue, type Transaction } from "firebasete-admin/firestore";

import { db } from "~/lib/db.server";
import { firestore } from "~/lib/firebase.server";
import sendgrid from "~/lib/sendgrid.server";

import { mapToObject } from "./utils/array-utils";
import { mapValues } from "./utils/object-utils";

// TODO: Refactor this file.

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export async function checkIn(
  user: User,
  eventId: string,
  orgId: string,
  teams: { [teamId: string]: "__skip__" | "__auto__" | "__undo__" | string },
  allowIncompleteWaivers: boolean = false
) {
  const eventRef = db.event(eventId);

  const eventSnap = await eventRef.get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });
  if (!event.roomAssignments) throw new Error("Event does not have room assignments set up.");
  const roomAssignments = event.roomAssignments;

  const studentsRef = db.eventStudents(eventRef.id);

  const fetchRoomAssignments = async (t: Transaction) => {
    return Promise.all(
      roomAssignments.map(async ({ id: roomAssignmentId, rooms: _rooms }) => {
        const fieldPath = new FieldPath("roomAssignments", roomAssignmentId);
        const rooms = await Promise.all(
          _rooms.map(async ({ id, maxStudents, preferTeamSize, priority }) => ({
            id,
            maxStudents,
            preferTeamSize,
            priority: priority ?? 0,
            numStudents: (await t.get(studentsRef.where(fieldPath, "==", id))).docs.length,
          }))
        );
        return { id: roomAssignmentId, rooms };
      })
    );
  };

  const fetchCheckedInTeams = async (t: Transaction) => {
    let query = db.eventTeams(eventRef.id).where("isCheckedIn", "==", true);
    const allCheckedInTeams = await t.get(query).then((x) => x.docs.map((y) => y.data()));
    const allCheckedInTeamsById = mapToObject(allCheckedInTeams, (x) => [x.id, x]);
    return allCheckedInTeamsById;
  };

  const fetchMaxNumber = async (t: Transaction) => {
    let query = db
      .eventTeams(eventRef.id)
      .where("number", "!=", "")
      .orderBy("number", "desc")
      .limit(1);
    const teamsWithNumbers = await t.get(query).then((x) => x.docs.map((y) => y.data()));
    return teamsWithNumbers.map((x) => Number(x.number)).find((x) => !isNaN(x)) ?? 0;
  };

  const fetchTeamsToCheckIn = async (
    t: Transaction,
    checkedInTeamsById: { [k: string]: EventTeam }
  ) => {
    const teamsToCheckIn = Object.entries(teams).filter(
      ([id]) => !(id in checkedInTeamsById) || teams[id] === "__undo__"
    );

    return Promise.all(
      teamsToCheckIn.map(async ([id, action]) => {
        const teamRef = db.eventTeam(eventRef.id, id);
        return {
          id,
          action,
          students: await t.get(studentsRef.where("team", "==", teamRef)),
          teamSnap: await t.get(teamRef),
        };
      })
    );
  };

  const transactionFunc = async (t: Transaction) => {
    const roomAssignments = await fetchRoomAssignments(t);
    const checkedInTeamsById = await fetchCheckedInTeams(t);
    const teamsToCheckIn = await fetchTeamsToCheckIn(t, checkedInTeamsById);

    let nextNumber = await fetchMaxNumber(t);
    nextNumber++;

    for (const { id, action, students, teamSnap } of teamsToCheckIn) {
      if (action === "__skip__" || students.docs.length === 0) continue;

      if (action === "__undo__") {
        const team = checkedInTeamsById[id];
        if (!team) throw new Error("Team not found.");
        t.update(db.eventTeam(eventRef.id, id), {
          isCheckedIn: false,
        });
        for (const student of students.docs) {
          t.update(student.ref, {
            isCheckedIn: false,
          });
        }
        for (const thing of Object.values(roomAssignments)) {
          const roomId = team.roomAssignments?.[thing.id];
          const room = thing.rooms.find((x) => x.id === roomId);
          if (room) room.numStudents -= students.docs.length;
        }
        continue;
      }

      if (id in checkedInTeamsById) {
        throw new Error(
          `Team ${id} is already checked in. Please undo check-in first before performing other actions.`
        );
      }

      const isAutoAssign = action === "__auto__";
      const isUseExisting = action === "__existing__";
      const isClear = action === "__clear__";

      if (!isAutoAssign && !isUseExisting && !isClear) {
        throw new Error("Only __auto__, __existing__, and __clear__ are supported");
      }

      const teamRef = db.eventTeam(eventRef.id, id);
      const teamData = teamSnap.data();

      if (isClear) {
        t.update(teamRef, {
          number: FieldValue.delete(),
          roomAssignments: FieldValue.delete(),
          isCheckedIn: FieldValue.delete(),
        });
        for (const student of students.docs) {
          t.update(student.ref, {
            number: FieldValue.delete(),
            roomAssignments: FieldValue.delete(),
            isCheckedIn: FieldValue.delete(),
          });
        }
        continue;
      }

      const chosenRooms: { [k: string]: (typeof roomAssignments)[number]["rooms"][number] } = {};

      if (isUseExisting) {
        if (!teamData?.roomAssignments) {
          throw new Error(`Team ${id} does not have existing room assignments.`);
        }

        for (const thing of Object.values(roomAssignments)) {
          const existingRoomId = teamData.roomAssignments[thing.id];
          if (!existingRoomId) {
            throw new Error(`Team ${id} does not have a room assignment for ${thing.id}.`);
          }

          const room = thing.rooms.find((x) => x.id === existingRoomId);
          if (!room) {
            throw new Error(`Room ${existingRoomId} for ${thing.id} does not exist.`);
          }

          // existing room assignment already counted in numStudents
          if (room.maxStudents - room.numStudents < 0) {
            throw new Error(`Not enough space in room ${existingRoomId} for ${thing.id}.`);
          }

          chosenRooms[thing.id] = room;
        }
      } else {
        for (const thing of Object.values(roomAssignments)) {
          const rooms = thing.rooms.filter(
            (x) => x.maxStudents - x.numStudents >= students.docs.length
          );

          if (rooms.length === 0) {
            throw new Error(`No more space left in rooms for ${thing.id}.`);
          }

          // prettier-ignore
          let room = rooms.reduce((a, b) =>
              // First, prioritize by priority (lower priority fills first)
              a.priority < b.priority ? a
            : b.priority < a.priority ? b
              // If any room prefers this team size, choose that one
            : a.preferTeamSize && a.preferTeamSize.includes(students.docs.length) ? a
            : b.preferTeamSize && b.preferTeamSize.includes(students.docs.length) ? b
              // If any room prefers not this team size, don't choose that one
            : a.preferTeamSize && !a.preferTeamSize.includes(students.docs.length) ? b
            : b.preferTeamSize && !b.preferTeamSize.includes(students.docs.length) ? a
              // If any room has exactly this team size of seats left, choose that one
            : a.maxStudents - a.numStudents === students.docs.length ? a
            : b.maxStudents - b.numStudents === students.docs.length ? b
              // Choose the room with the lower proportion of seats filled
            : a.numStudents / a.maxStudents < b.numStudents / b.maxStudents ? a
            : b.numStudents / b.maxStudents < a.numStudents / a.maxStudents ? b
              // Choose the room with the higher number of seats left
            : a.maxStudents - a.numStudents > b.maxStudents - b.numStudents ? a
            : b
          );

          room.numStudents += students.docs.length;
          chosenRooms[thing.id] = room;
        }
      }

      let number: string;
      if (teamData?.number) {
        number = teamData.number;
      } else {
        number = String(nextNumber++).padStart(3, "0");
      }

      const taken = new Set(
        students.docs
          .map((x) => x.data().number)
          .map((x) => x?.startsWith(number) && x[x.length - 1])
          .filter(Boolean)
      );

      const doneRoomAssignments = mapValues(chosenRooms, (x) => x.id);

      t.update(db.eventTeam(eventRef.id, id), {
        number,
        roomAssignments: doneRoomAssignments,
        isCheckedIn: true,
      });

      for (const student of students.docs) {
        if (!student.data().waiver && event.waiver && !allowIncompleteWaivers)
          throw new Error(
            `Student ${student.data().fname} ${student.data().lname} has not signed waiver.`
          );

        const studentData = student.data();
        let studentNumber: string;
        if (studentData.number && studentData.number.startsWith(number)) {
          studentNumber = studentData.number;
        } else {
          const letter = alphabet.find((x) => !taken.has(x));
          studentNumber = `${number}${letter}`;
          taken.add(letter);
        }

        t.update(student.ref, {
          number: studentNumber,
          roomAssignments: doneRoomAssignments,
          isCheckedIn: true,
        });
      }
    }

    return new Set(teamsToCheckIn.map((x) => x.id));
  };

  let teamIds = await firestore.runTransaction(transactionFunc);

  try {
    const org = await db.org(orgId).get();
    const orgData = org.data();
    if (!orgData) return;

    const teams = await db.eventTeams(eventRef.id).where("org", "==", db.org(orgId)).get();
    const students = await db.eventStudents(eventRef.id).where("org", "==", db.org(orgId)).get();

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
        x.number
          ? `[${x.number}] ${x.name} — ${Object.entries(x.roomAssignments ?? {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(" / ")}`
          : `${x.name} — Not Checked In`
      )
      .join("<br>");

    const studentsText = students.docs
      .map((x) => x.data())
      .map((x) =>
        x.number
          ? `[${x.number}] ${x.fname} ${x.lname} — ${Object.entries(x.roomAssignments ?? {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(" / ")}`
          : `${x.fname} ${x.lname} — Not Checked In`
      )
      .join("<br>");

    await sendgrid.send({
      to: org.data()?.adminData.email,
      from: "noreply@contestdojo.com",
      templateId: "d-1d624e07ec5b4930824eecc1e28007e1",
      dynamicTemplateData: {
        event: event.name,
        org: orgData.name,
        text: "Teams:<br><br>" + teamsText + "<br><br>Students:<br><br>" + studentsText,
      },
    });
  } catch (e) {
    console.error(e);
  }
}
