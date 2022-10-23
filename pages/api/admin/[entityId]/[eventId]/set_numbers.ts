/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { firestore, withFirebaseAuth } from "~/helpers/firebase";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const handler = withFirebaseAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { eventId } = req.query;
  if (typeof eventId !== "string") return res.status(400).end();

  const eventRef = firestore.collection("events").doc(eventId);
  const event = await eventRef.get();
  const eventData = event.data();

  if (!eventData) return res.status(404).end();

  const batches = [firestore.batch()];

  if (eventData.teamsEnabled) {
    // Fetch orgs
    const orgsRef = firestore.collection("orgs");
    const orgs = await orgsRef.get();
    const orgsById = orgs.docs.reduce((acc, x) => acc.set(x.id, x.data()), new Map<string, any>());

    // Fetch teams (that have orgs)
    const teamsRef = eventRef.collection("teams");
    let { docs: teams } = await teamsRef.get();
    teams = teams.filter((x) => orgsById.get(x.data().org.id));

    // Sort teams by org name & put non-empty numbers in front
    teams.sort((a, b) => {
      if (!a.data().number) return 1;
      if (!b.data().number) return -1;
      return orgsById.get(a.data().org.id).name.localeCompare(orgsById.get(b.data().org.id).name);
    });

    // Store to number students later
    const teamsById = new Map<string, any>();

    let num = 1; // Number to start from
    let count = 0;

    for (const team of teams) {
      const data = team.data();
      if (data.number) {
        // Set `num` to maximum existing number + 1
        // Teams with non-empty numbers are in front, so `num` will be good
        num = Math.max(num, (Number(data.number) || 0) + 1);
        teamsById.set(team.id, { ...data, _idx: 0 }); // _idx is for counting students later
        continue;
      }

      const number = String(num).padStart(3, "0");
      teamsById.set(team.id, { ...data, number, _idx: 0 }); // _idx is for counting students later
      batches[batches.length - 1].update(team.ref, { number });
      num++;
      count++;
      if (count % 500 === 0) batches.push(firestore.batch());
    }

    // Fetch students (that have teams, and orgs)
    const studentsRef = eventRef.collection("students");
    let { docs: students } = await studentsRef.get();
    students = students.filter((x) => x.data().team && teamsById.get(x.data().team.id));

    const valid = new Set<string>(); // Already validly numbered students
    const numbers = new Set<string>(); // Those students' numbers

    for (const student of students) {
      const team = teamsById.get(student.data().team.id);
      const number = student.data().number;
      if (number && number.startsWith(team.number)) {
        valid.add(student.id);
        numbers.add(number);
      }
    }

    for (const student of students) {
      // Continue if already has a valid number
      if (valid.has(student.id)) continue;

      const team = teamsById.get(student.data().team.id);

      // Find next non-taken number + letter combo
      let number = team.number + alphabet[team._idx];
      while (numbers.has(number)) {
        team._idx++;
        number = team.number + alphabet[team._idx];
      }

      batches[batches.length - 1].update(student.ref, { number });
      numbers.add(number);

      team._idx++;
      count++;

      if (count % 500 === 0) batches.push(firestore.batch());
    }
  } else {
    // Fetch orgs
    const orgsRef = firestore.collection("orgs");
    const orgs = await orgsRef.get();
    const orgsById = orgs.docs.reduce((acc, x) => acc.set(x.id, x.data()), new Map<string, any>());

    // Fetch students (that have teams)
    const studentsRef = eventRef.collection("students");
    let { docs: students } = await studentsRef.get();
    students = students.filter((x) => x.data().team && orgsById.get(x.data().org.id));

    // Sort students by org name & put non-empty numbers in front
    students.sort((a, b) => {
      if (!a.data().number) return 1;
      if (!b.data().number) return -1;
      return orgsById.get(a.data().org.id).name.localeCompare(orgsById.get(b.data().org.id).name);
    });

    let num = 1; // Number to start from
    let count = 0;

    for (const student of students) {
      const data = student.data();
      if (data.number) {
        // Set `num` to maximum existing number + 1
        // Teams with non-empty numbers are in front, so `num` will be good
        num = Math.max(num, (Number(data.number) || 0) + 1);
        continue;
      }

      const number = String(num).padStart(3, "0");
      batches[batches.length - 1].update(student.ref, { number });
      num++;
      count++;
      if (count % 500 === 0) batches.push(firestore.batch());
    }
  }

  await Promise.all(batches.map((x) => x.commit()));

  res.status(200).end();
}, "admin");

export default handler;
