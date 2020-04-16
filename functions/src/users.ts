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
					display_name: user.displayName,
				};
				await admin.firestore().collection("users").doc(uid).set(data);
			} catch (error) {
				console.log("Error adding registration of user to database");
				console.log(error);
			}
		}
	);

export const getAttemptedTaskStatusListForUser = functions
	.region("asia-east2")
	.https.onRequest(async (req, res) => {
		/*
		 * Arguments: uid (string)
		 * Outputs: Object with key value pairs
		 */
		res.set("Access-Control-Allow-Origin", "*");
		const uid = req.query.uid;
		if (!(typeof uid === "string")) {
			throw new functions.https.HttpsError(
				"invalid-argument",
				"User ID must be a string"
			);
		}
		try {
			const query = admin
				.firestore()
				.collection("submissions")
				.orderBy("points")
				.where("uid", "==", uid);
			const result: { [key: string]: boolean } = {};
			const docs = (await query.get()).docs;
			docs.forEach((doc) => {
				const data = doc.data();
				if (data.points === 100) {
					// What if full score isn't 100?
					result[data.problem_id as string] = true;
				} else {
					// Since we sorted by points, a fully scoring entry will always come after this
					result[data.problem_id as string] = false;
				}
			});
			res.send(result);
		} catch (error) {
			throw new functions.https.HttpsError("unknown", error);
		}
	});
