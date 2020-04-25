import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { writeCode } from "./util";

export const makeSubmission = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const { id, code, lang } = request_data;
			const uid = context.auth?.uid;
			if (!(typeof id === "string") || id.length === 0) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"Problem ID must be a non-empty string"
				);
			}
			if (!Array.isArray(code)) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"Code must be a non-empty string"
				);
			}
			if (!(typeof lang === "string") || lang.length === 0) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"Language must be a non-empty string"
				);
			}
			try {
				const taskSnapshot = await admin
					.firestore()
					.collection("tasks")
					.where("id", "==", id)
					.get();
				if (taskSnapshot.docs.length === 0)
					throw new Error("Not found problem!!!");
				else if (taskSnapshot.docs.length === 1) {
					const data = taskSnapshot.docs[0].data();
					const submissionID = (
						await admin.firestore().collection("submissions").add({
							language: lang,
							problem: data,
							points: -1,
							timestamp: admin.firestore.Timestamp.now(),
							uid: uid,
						})
					).id;
					await writeCode(submissionID, code);
					return submissionID;
				} else {
					throw new Error("Duplicate snapshots found!!!");
				}
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);
