const functions = require("firebase-functions");
const admin = require("firebase-admin");
const generator = require("generate-password");
const sendgrid = require("@sendgrid/mail");

sendgrid.setApiKey(functions.config().sendgrid.key);
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
            from: "ncmt@oliver.ni",
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
