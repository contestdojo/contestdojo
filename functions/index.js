const functions = require("firebase-functions");
const admin = require("firebase-admin");
const generator = require("generate-password");
const sendgrid = require("@sendgrid/mail");

sendgrid.setApiKey(functions.config().sendgrid.key);
admin.initializeApp();

exports.updateOrgAdmin = functions.firestore.document("/orgs/{orgId}").onWrite(async (change, context) => {
    const { admin } = change.after.data();
    const adminData = await admin.get();
    await change.after.ref.update({ adminData: adminData.data() });
});

exports.createStudentAccount = functions.https.onCall(async ({ fname, lname, email }, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");

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
        await admin.firestore().collection("users").doc(user.uid).set({
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
    const snapshot = await admin.firestore().collection("users").doc(user.uid).get();
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
});

exports.startTest = functions.https.onCall(async ({ eventId, testId }, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");

    const uid = context.auth.uid;
    const snapshot = await admin.firestore().collection("users").doc(uid).get();
    const userData = snapshot.data();

    // Make sure student account
    if (userData.type !== "student") {
        throw new functions.https.HttpsError("failed-precondition", "This account is not a student account.");
    }

    const eventRef = admin.firestore().collection("events").doc(eventId);
    const testRef = eventRef.collection("tests").doc(testId);
    const testSnapshot = await testRef.get();
    const testData = testSnapshot.data();

    const openTime = testSnapshot.data()?.openTime?.toDate();
    const closeTime = testSnapshot.data()?.closeTime?.toDate();
    const now = new Date();

    if (!openTime || !closeTime || now < openTime || now > closeTime) {
        throw new functions.https.HttpsError("failed-precondition", "This test is not open.");
    }

    const studentSnapshot = await eventRef.collection("students").doc(uid).get();
    const studentData = studentSnapshot.data();

    const submissionId = testData.team ? studentData.team.id : uid;
    const submissionRef = testRef.collection("submissions").doc(submissionId);
    const submissionSnapshot = await submissionRef.get();

    if (!submissionSnapshot.exists) {
        submissionRef.set({
            startTime: admin.firestore.Timestamp.fromDate(now),
            endTime: admin.firestore.Timestamp.fromDate(
                new Date(Math.min(testData.closeTime.seconds * 1000, now.getTime() + testData.duration * 1000))
            ),
        });
    }

    return { status: "success" };
});
