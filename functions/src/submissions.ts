import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { unzipCode, writeCode } from "./util";
import { checkAdmin } from "./admin";

export const makeSubmission = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			let { id, code, lang } = request_data;
			const uid = context.auth?.uid;
			if (typeof code === "string") {
				code = await unzipCode(code, id);
			}
			if (!(typeof id === "string") || id.length === 0) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"Problem ID must be a non-empty string"
				);
			}
			if (!(Array.isArray(code) || typeof code === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"Code must be a non-empty Array of string"
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
				if (taskSnapshot.docs.length === 1) {
					const taskDoc = taskSnapshot.docs[0].data();
					if (taskDoc.visible === true || checkAdmin(context)) {
						if (typeof code === "string") {
							code = await unzipCode(code, taskDoc.fileName);
							if (!Array.isArray(code)) {
								throw new functions.https.HttpsError(
									"invalid-argument",
									"code must be zip file"
								);
							}
						}
						const submissionID = (
							await admin
								.firestore()
								.collection("submissions")
								.add({
									language: lang,
									task: taskDoc,
									points: -1,
									timestamp: admin.firestore.Timestamp.now(),
									uid: uid,
								})
						).id;
						await writeCode(submissionID, code);
						return submissionID;
					} else {
						throw new Error("Permission denied");
					}
				} else {
					throw new Error("Have Problem with task!!!");
				}
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);
