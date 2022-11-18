/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import admin from "firebase-admin";

import { firestore, withFirebaseAuth } from "~/helpers/firebase";
import { testAuthorization } from "~/helpers/rules";

const handler = withFirebaseAuth(async (req, res, { uid }) => {
  if (req.method !== "POST") return res.status(405).end();

  const { eventId, testId } = req.query;
  if (typeof eventId !== "string") return res.status(400).end();
  if (typeof testId !== "string") return res.status(400).end();

  const eventRef = firestore.collection("events").doc(eventId);
  const eventSnapshot = await eventRef.get();
  const eventData = eventSnapshot.data();

  const testRef = eventRef.collection("tests").doc(testId);
  const testSnapshot = await testRef.get();
  const testData = testSnapshot.data();

  const studentRef = eventRef.collection("students").doc(uid);
  const studentSnapshot = await studentRef.get();
  const studentData = studentSnapshot.data();

  if (!eventData) return res.status(404).send("Event not found.");
  if (!testData) return res.status(404).send("Test not found.");
  if (!studentData) return res.status(400).send("Student not found.");

  const openTime = testData.openTime?.toDate();
  const closeTime = testData.closeTime?.toDate();
  const now = new Date();

  if (!openTime || !closeTime || now < openTime || now > closeTime) {
    return res.status(400).send("This test is not open.");
  }

  if (
    testData.authorizedIds &&
    !testData.authorizedIds.includes(uid) &&
    !(studentData.number && testData.authorizedIds.includes(studentData.number))
  ) {
    return res.status(400).send("You are not authorized to start this test.");
  }

  if (testData.authorization && !testAuthorization(testData.authorization, studentData)) {
    return res.status(400).send("You are not authorized to start this test.");
  }

  if (!studentData.team) {
    return res.status(400).send("You must be placed on a team before starting a test.");
  }

  const submissionId = testData.team ? studentData.team.id : uid;
  const submissionRef = testRef.collection("submissions").doc(submissionId);
  const submissionSnapshot = await submissionRef.get();

  if (!submissionSnapshot.exists) {
    if (studentData.nextSelectedStart && now < studentData.nextSelectedStart.toDate()) {
      return res.status(400).send("You already have another selected event in progress.");
    }

    const endTime = admin.firestore.Timestamp.fromDate(
      new Date(Math.min(testData.closeTime.seconds * 1000, now.getTime() + testData.duration * 1000))
    );

    await submissionRef.set({
      startTime: admin.firestore.Timestamp.fromDate(now),
      endTime: endTime,
    });

    if (eventData.testSelection && Object.keys(eventData.testSelection).includes(testId)) {
      await studentRef.update({
        startedSelected: testId,
        nextSelectedStart: admin.firestore.Timestamp.fromDate(new Date(testData.closeTime.seconds * 1000 + 30000)),
      });
    }
  }

  res.status(204).end();
}, "student");

export default handler;
