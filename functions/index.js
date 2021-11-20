/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const generator = require("generate-password");
const sendgrid = require("@sendgrid/mail");

sendgrid.setApiKey(functions.config().sendgrid.key);
admin.initializeApp();

const db = admin.firestore();

const requireAuth = (accType, func) => async (args, context) => {
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");

  const uid = context.auth.uid;
  const snapshot = await db.collection("users").doc(uid).get();
  const userData = snapshot.data();

  // Make sure student account
  if (userData.type !== accType) {
    throw new functions.https.HttpsError("failed-precondition", "This account is not a student account.");
  }

  return await func(args, context);
};

exports.updateOrgAdmin = functions.firestore.document("/orgs/{orgId}").onWrite(async (change, context) => {
  const { admin } = change.after.data();
  const adminData = await admin.get();
  await change.after.ref.update({ adminData: adminData.data() });
});

exports.createStudentAccount = functions.https.onCall(
  requireAuth("coach", async ({ fname, lname, email }, context) => {
    let user;
    let existed = true;

    try {
      user = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw new functions.https.HttpsError("unknown", error.message);
      }

      existed = false;

      const password = generator.generate({
        length: 12,
        numbers: true,
      });

      // User didn't exist, create user now
      user = await admin.auth().createUser({
        email,
        password,
        displayName: `${fname} ${lname}`,
      });

      // Set info in firestore
      await db.collection("users").doc(user.uid).set({
        fname,
        lname,
        email,
        type: "student",
      });

      await sendgrid.send({
        to: email,
        from: "noreply@contestdojo.com",
        templateId: "d-8c5c1f774b5c41138c5018d05396ecd0",
        dynamicTemplateData: {
          fname,
          lname,
          email,
          password,
        },
      });
    }

    // Get user data
    const snapshot = await db.collection("users").doc(user.uid).get();
    const userData = snapshot.data();

    // Make sure student account
    if (userData.type !== "student") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "This email address is already associated with a non-student account."
      );
    }

    return {
      existed,
      fname: userData.fname,
      lname: userData.lname,
      email: userData.email,
      uid: user.uid,
    };
  })
);

exports.startTest = functions.https.onCall(
  requireAuth("student", async ({ eventId, testId }, context) => {
    const eventRef = db.collection("events").doc(eventId);
    const eventSnapshot = await eventRef.get();
    const eventData = eventSnapshot.data();

    const testRef = eventRef.collection("tests").doc(testId);
    const testSnapshot = await testRef.get();
    const testData = testSnapshot.data();
    const uid = context.auth.uid;

    const openTime = testSnapshot.data()?.openTime?.toDate();
    const closeTime = testSnapshot.data()?.closeTime?.toDate();
    const now = new Date();

    const studentRef = eventRef.collection("students").doc(uid);
    const studentSnapshot = await studentRef.get();
    const studentData = studentSnapshot.data();

    if (!openTime || !closeTime || now < openTime || now > closeTime) {
      throw new functions.https.HttpsError("failed-precondition", "This test is not open.");
    }

    const submissionId = testData.team ? studentData.team.id : uid;
    const submissionRef = testRef.collection("submissions").doc(submissionId);
    const submissionSnapshot = await submissionRef.get();

    if (!submissionSnapshot.exists) {
      await submissionRef.set({
        startTime: admin.firestore.Timestamp.fromDate(now),
        endTime: admin.firestore.Timestamp.fromDate(
          new Date(Math.min(testData.closeTime.seconds * 1000, now.getTime() + testData.duration * 1000))
        ),
      });
    }

    if (eventData.testSelection && Object.keys(eventData.testSelection).includes(testId)) {
      await studentRef.update({ startedSelected: true });
    }

    return { status: "success" };
  })
);

exports.date = functions.https.onCall(() => {
  return { datetime: new Date().toISOString() };
});

exports.gradeTests = functions.https.onCall(
  requireAuth("admin", async ({ eventId, testId, problemIdx }, context) => {
    const testRef = db.collection("events").doc(eventId).collection("tests").doc(testId);
    const gradedSubmissionsRef = testRef.collection("graded");

    await db.runTransaction(async (t) => {
      const answersSnapshot = await t.get(testRef.collection("private").doc("answers"));
      let answers = Object.entries(answersSnapshot.data());

      if (problemIdx !== undefined) {
        answers = answers.filter(([idx]) => idx === problemIdx.toString());
      }

      const submissionsSnapshot = await t.get(testRef.collection("submissions"));
      for (const s of submissionsSnapshot.docs) {
        const submission = s.data();
        const graded = {};
        for (const [idx, problem] of answers) {
          if (problem.hasOwnProperty(submission[`${idx}r`])) {
            graded[idx] = Number(problem[submission[`${idx}r`]]);
          } else {
            graded[idx] = null;
          }
        }
        t.set(gradedSubmissionsRef.doc(s.id), graded, { merge: true });
      }
    });

    return { status: "success" };
  })
);

exports.updateGradedInfo = functions.firestore
  .document("/events/{eventId}/tests/{testId}/graded/{submissionId}")
  .onCreate(async (snap, context) => {
    const { eventId, testId, submissionId } = context.params;
    const eventRef = db.collection("events").doc(eventId);

    const testSnapshot = await eventRef.collection("tests").doc(testId).get();
    const test = testSnapshot.data();

    if (test.type !== "guts") return;

    let name, number, orgId;

    if (test.team) {
      const teamSnapshot = await eventRef.collection("teams").doc(submissionId).get();
      const team = teamSnapshot.data();
      name = team.name;
      number = team.number;
      orgId = team.org.id;
    } else {
      const studentSnapshot = await eventRef.collection("students").doc(submissionId).get();
      const student = studentSnapshot.data();
      name = student.fname + " " + student.lname;
      number = student.number;
      orgId = student.org.id;
    }

    const orgSnapshot = await db.collection("orgs").doc(orgId).get();
    const org = orgSnapshot.data();

    await snap.ref.update({ name, number, orgName: org.name });
  });

exports.updateGutsSet = functions.firestore
  .document("/events/{eventId}/tests/{testId}/submissions/{submissionId}")
  .onWrite(async (change, context) => {
    const { eventId, testId, submissionId } = context.params;

    const { gutsSet: oldGutsSet } = change.before.data();
    const { gutsSet } = change.after.data();
    if (gutsSet === undefined || gutsSet === oldGutsSet) return;

    const testRef = db.collection("events").doc(eventId).collection("tests").doc(testId);
    await testRef.collection("graded").doc(submissionId).set({ gutsSet }, { merge: true });
  });

exports.updateStudentNumbers = functions.https.onCall(
  requireAuth("admin", async ({ eventId }, context) => {
    const eventRef = db.collection("events").doc(eventId);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const teamsSnapshot = await eventRef.collection("teams").get();
    const teamsById = teamsSnapshot.docs.reduce((obj, x) => {
      const data = x.data();
      obj[x.id] = { ...data, ...obj[x.id] };
      return obj;
    }, {});

    const studentsSnapshot = await eventRef.collection("students").get();
    const students = studentsSnapshot.docs;

    for (const student of students) {
      if (!student.data().team) continue;

      const team = teamsById[student.data().team.id];
      const teamNumber = team?.number;
      if (teamNumber === undefined || teamNumber === "") continue;

      const idx = team._idx ?? 0;
      student.ref.update({
        number: teamNumber + alphabet[idx],
      });
      team._idx = idx + 1;
    }

    return { status: "success" };
  })
);
