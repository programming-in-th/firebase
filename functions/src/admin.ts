import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const checkAdmin = async (context: functions.https.CallableContext) => {
	if (!context.auth) return false;
	const uid = context.auth ? context.auth.uid : "";
	if (!(typeof uid === "string")) {
		throw new functions.https.HttpsError(
			"invalid-argument",
			"admin UID must be a string, given UID = " + uid
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
};

export const getIsAdmin = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			return checkAdmin(context);
		}
	);

export const getAllUser = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return;
			try {
				const userSnapShot = admin.firestore().collection("users");
				const userDoc = await userSnapShot.get();
				const userListRaw = await admin.auth().listUsers();
				const userList: Object[] = [];
				let map = new Map();
				userDoc.docs.forEach(val => {
					map.set(val.data().uid, val.data().admin);
				});
				userListRaw.users.forEach(record => {
					const nowdata = record.toJSON();
					(nowdata as any).admin = map.get((nowdata as any).uid);
					userList.push(nowdata);
				});
				return userList;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);
