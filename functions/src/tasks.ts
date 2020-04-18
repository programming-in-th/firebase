import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const getAllProblemIDs = functions
	.region("asia-east2")
	.https.onRequest(async (req, res) => {
		res.set("Access-Control-Allow-Origin", "*");

		try {
			const taskDocRefs = admin
				.firestore()
				.collection("tasks")
				.where("visible", "==", true);
			const taskDocs = await taskDocRefs.get();
			const result: Object[] = [];
			taskDocs.docs.forEach((doc) => {
				const data = doc.data();
				result.push(data.id);
			});

			res.send(result);
		} catch (error) {
			throw new functions.https.HttpsError("unknown", error);
		}
	});

export const getProblemMetadata = functions
	.region("asia-east2")
	.https.onRequest(async (req, res) => {
		res.set("Access-Control-Allow-Origin", "*");
		const id = req.query.id;

		if (!(typeof id === "string")) {
			throw new functions.https.HttpsError(
				"invalid-argument",
				"problem ID must be a string, given problem ID = " + id
			);
		}

		try {
			const taskSnapshot = await admin
				.firestore()
				.collection("tasks")
				.where("id", "==", id)
				.get();
			if (taskSnapshot.docs.length === 0) res.send({});
			else if (taskSnapshot.docs.length === 1) {
				const data = taskSnapshot.docs[0].data();
				if (data.visible === true) {
					res.send(taskSnapshot.docs[0].data());
				} else {
					res.send({});
				}
			} else {
				throw new Error("Duplicate snapshots found!!!");
			}
		} catch (error) {
			throw new functions.https.HttpsError("unknown", error);
		}
	});
