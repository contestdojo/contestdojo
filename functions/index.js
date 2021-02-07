const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

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

        // User didn't exist, create user now
        user = await admin.auth().createUser({
            email,
            password: "helloworld",
            displayName: `${fname} ${lname}`,
        });

        // Set info in firestore
        await admin.firestore().collection("users").doc(user.uid).set({
            fname,
            lname,
            email,
            type: "student",
        });
    }

    // Get user data
    const snapshot = await admin.firestore().collection("users").doc(user.uid).get();
    const userData = snapshot.data();

    // Make sure student account
    if (userData.type !== "student") {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "This email address is associated with a coach account."
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

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
