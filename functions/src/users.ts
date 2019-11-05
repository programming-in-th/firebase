import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onRegister = functions
  .region("asia-east2")
  .auth.user()
  .onCreate(
    async (user: admin.auth.UserRecord, context: functions.EventContext) => {
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

export const getIsAdmin = functions
  .region("asia-east2")
  .https.onCall(
    async (request_data: any, context: functions.https.CallableContext) => {
      if (!context.auth) return false;
      const uid = context.auth ? context.auth.uid : "";
      if (!(typeof uid === "string")) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "admni UID must be a string, given UID = " + uid
        );
      }
      try {
        const userSnapshot = await admin
          .firestore()
          .collection("users")
          .doc(uid)
          .get();
        if (!userSnapshot.exists) return false;
        return userSnapshot.data()!.admin;
      } catch (error) {
        throw new functions.https.HttpsError("unknown", error);
      }
    }
  );
