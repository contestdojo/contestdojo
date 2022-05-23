/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { firestore, withFirebaseAuth } from "~/helpers/firebase";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const handler = withFirebaseAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { eventId } = req.query;
  if (typeof eventId !== "string") return res.status(400).end();

  const orgsRef = firestore.collection("orgs");
  const orgs = await orgsRef.get();
  const orgsById = orgs.docs.reduce((acc, x) => {
    acc.set(x.id, x.data());
    return acc;
  }, new Map<string, any>());

  const eventRef = firestore.collection("events").doc(eventId);
  const teamsRef = eventRef.collection("teams");
  let { docs: teams } = await teamsRef.get();
  teams = teams.filter((x) => orgsById.get(x.data().org.id));

  teams.sort((a, b) => {
    // Put values with non-empty number at front
    if (!a.data().number) return 1;
    if (!b.data().number) return -1;
    return orgsById.get(a.data().org.id).name.localeCompare(orgsById.get(b.data().org.id).name);
  });

  const teamsById = new Map<string, any>();
  const batches = [firestore.batch()];

  let num = 1;
  let count = 0;

  for (const team of teams) {
    const data = team.data();
    console.log(data.number);
    if (data.number) {
      num = Math.max(num, (Number(data.number) || 0) + 1);
      teamsById.set(team.id, { ...data, _idx: 0 });
      continue;
    }

    const number = String(num).padStart(3, "0");
    teamsById.set(team.id, { ...data, number, _idx: 0 });
    batches[batches.length - 1].update(team.ref, { number });
    num++;
    count++;
    if (count % 500 === 0) batches.push(firestore.batch());
  }

  const studentsRef = eventRef.collection("students");
  let { docs: students } = await studentsRef.get();
  students = students.filter((x) => x.data().team && teamsById.get(x.data().team.id));

  const valid = new Set<string>();
  const numbers = new Set<string>();

  for (const student of students) {
    const team = teamsById.get(student.data().team.id);
    const number = student.data().number;
    if (number && number.startsWith(team.number)) {
      valid.add(student.id);
      numbers.add(number);
    }
  }

  for (const student of students) {
    if (valid.has(student.id)) continue;

    const team = teamsById.get(student.data().team.id);

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

  await Promise.all(batches.map((x) => x.commit()));

  res.status(200).end();
}, "admin");

export default handler;
