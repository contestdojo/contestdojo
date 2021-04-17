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
                from: "noreply@stanfordmathtournament.com",
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
        const testRef = eventRef.collection("tests").doc(testId);
        const testSnapshot = await testRef.get();
        const testData = testSnapshot.data();
        const uid = context.auth.uid;

        const openTime = testSnapshot.data()?.openTime?.toDate();
        const closeTime = testSnapshot.data()?.closeTime?.toDate();
        const now = new Date();

        if (!openTime || !closeTime || now < openTime || now > closeTime) {
            throw new functions.https.HttpsError("failed-precondition", "This test is not open.");
        }

        const studentRef = eventRef.collection("students").doc(uid);
        const studentSnapshot = await studentRef.get();
        const studentData = studentSnapshot.data();

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

        if (!testData.team) {
            await studentRef.update({ started: true });
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

        const answersSnapshot = await testRef.collection("private").doc("answers").get();
        let answers = Object.entries(answersSnapshot.data());

        if (problemIdx !== undefined) {
            answers = answers.filter(([idx]) => idx === problemIdx.toString());
        }

        const submissionsSnapshot = await testRef.collection("submissions").get();
        for (const s of submissionsSnapshot.docs) {
            const submission = s.data();
            const graded = {};
            for (const [idx, problem] of answers) {
                graded[idx] = Number(!!problem[submission[`${idx}r`]]);
            }
            gradedSubmissionsRef.doc(s.id).set(graded, { merge: true });
        }

        return { status: "success" };
    })
);

exports.updateStudentNumbers = functions.https.onCall(
    requireAuth("admin", async ({ eventId }, context) => {
        const eventRef = db.collection("events").doc(eventId);

        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        await db.runTransaction(async t => {
            const teamsSnapshot = await t.get(eventRef.collection("teams"));
            const teamsById = teamsSnapshot.docs.reduce((obj, x) => {
                const data = x.data();
                obj[x.id] = { ...data, ...obj[x.id] };
                return obj;
            }, {});

            const studentsSnapshot = await t.get(eventRef.collection("students"));
            const students = studentsSnapshot.docs;

            for (const student of students) {
                const team = teamsById[student.data().team.id];
                const teamNumber = team?.number;
                if (teamNumber === undefined || teamNumber === "") continue;

                const idx = team._idx ?? 0;
                t.update(student.ref, {
                    number: teamNumber + alphabet[idx],
                });
                team._idx = idx + 1;
            }
        });

        return { status: "success" };
    })
);
