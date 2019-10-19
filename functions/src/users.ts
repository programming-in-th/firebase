import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onRegister = functions
    .region("asia-east2")
    .auth.user()
    .onCreate(
        async (
            user: admin.auth.UserRecord,
            context: functions.EventContext
        ) => {
            try {
                const uid = user.uid;
                const data = {
                    uid: uid,
                    display_name: user.displayName
                };
                await admin
                    .firestore()
                    .collection("users")
                    .doc(uid)
                    .set(data);
            } catch (error) {
                console.log("Error adding registration of user to database");
                console.log(error);
            }
        }
    );
