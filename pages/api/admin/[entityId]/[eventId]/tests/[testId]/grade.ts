/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { firestore, withFirebaseAuth } from "~/helpers/firebase";

const handler = withFirebaseAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { eventId, testId } = req.query;
  if (typeof eventId !== "string") return res.status(400).end();
  if (typeof testId !== "string") return res.status(400).end();

  const { problemIdx } = req.body;
  if (typeof problemIdx !== "undefined" && !Number.isInteger(problemIdx)) return res.status(400).end();

  const testRef = firestore.collection("events").doc(eventId).collection("tests").doc(testId);
  const gradedSubmissionsRef = testRef.collection("graded");

  const answersRef = testRef.collection("private").doc("answers");
  const answers = await answersRef.get();
  const answersData = answers.data();
  if (!answersData) return res.status(400).send("Answers not found.");

  let answersEntries = Object.entries(answersData);
  if (problemIdx !== undefined) {
    answersEntries = answersEntries.filter(([idx]) => idx === problemIdx.toString());
  }

  const answersFreq = answersEntries.map<[string, { [key: string]: number }]>(([idx]) => [idx, {}]);

  const submissionsRef = testRef.collection("submissions");
  const submissions = await submissionsRef.get();

  // Write batches

  const batches = [firestore.batch()];
  let count = 0;

  for (const s of submissions.docs) {
    const submission = s.data();
    const graded: { [key: string]: number | null } = {};

    for (const [_i, [idx, problem]] of answersEntries.entries()) {
      if (problem.hasOwnProperty(submission[`${idx}r`])) {
        graded[idx] = Number(problem[submission[`${idx}r`]]);

        if (graded[idx] == 1) {
          // Count freq
          if (!answersFreq[_i][1][submission[`${idx}r`]]) answersFreq[_i][1][submission[`${idx}r`]] = 0;
          answersFreq[_i][1][submission[`${idx}r`]]++;
        }
      } else {
        graded[idx] = null;
      }
    }

    if (count === 500) {
      batches.push(firestore.batch());
      count = 0;
    }

    batches[batches.length - 1].set(gradedSubmissionsRef.doc(s.id), graded, { merge: true });
    count++;
  }

  const solutionsRef = testRef.collection("private").doc("solutions");
  const solutions = answersFreq.map(([idx, entry]) => [
    idx,
    Object.keys(entry).reduce((a, b) => (entry[a] > entry[b] ? a : b), "") || null,
  ]);

  batches[batches.length - 1].set(solutionsRef, Object.fromEntries(solutions), { merge: true });

  await Promise.all(batches.map((x) => x.commit()));

  res.status(204).end();
}, "admin");

export default handler;
