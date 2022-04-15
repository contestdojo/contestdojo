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
  teams.sort((a, b) => orgsById.get(a.data().org.id).name.localeCompare(orgsById.get(b.data().org.id).name));

  const studentsRef = eventRef.collection("students");
  const students = await studentsRef.get();

  const teamsById = new Map<string, any>();
  const batches = [firestore.batch()];
  let count = 0;

  for (const team of teams) {
    const data = team.data();
    const number = String(count + 1).padStart(3, "0");
    teamsById.set(team.id, { ...data, number });

    batches[batches.length - 1].update(team.ref, { number });
    count++;
    if (count % 500 === 0) batches.push(firestore.batch());
  }

  for (const student of students.docs) {
    if (!student.data().team) continue;

    const team = teamsById.get(student.data().team.id);
    if (!team) continue;

    const idx = team._idx ?? 0;
    team._idx = idx + 1;

    batches[batches.length - 1].update(student.ref, { number: team.number + alphabet[idx] });
    count++;
    if (count % 500 === 0) batches.push(firestore.batch());
  }

  await Promise.all(batches.map((x) => x.commit()));

  res.status(200).end();
}, "admin");

export default handler;
