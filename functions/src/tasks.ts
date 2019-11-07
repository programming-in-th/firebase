import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const getAllTasks = functions
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
			taskDocs.docs.forEach(doc => {
				const data = doc.data();

				result.push(data);
			});

			res.send(result);
		} catch (error) {
			throw new functions.https.HttpsError("unknown", error);
		}
	});

// export const getTasksWithFilter = functions
// 	.region("asia-east2")
// 	.https.onRequest(async (req, res) => {
// 		res.set("Access-Control-Allow-Origin", "*");
// 		const limit = req.query.limit;
// 		const min_difficulty = req.query.min_difficulty;
// 		const max_difficulty = req.query.max_difficulty;
// 		const tags = req.query.tags;

// 		if (!(typeof limit === "number") || limit <= 0) {
// 			throw new functions.https.HttpsError(
// 				"invalid-argument",
// 				"Limit must be a number > 0"
// 			);
// 		}

// 		if (!(typeof min_difficulty === "number") || min_difficulty < 0) {
// 			throw new functions.https.HttpsError(
// 				"invalid-argument",
// 				"Min difficulty must be a number >= 0"
// 			);
// 		}

// 		if (
// 			!(typeof max_difficulty === "number") ||
// 			max_difficulty < min_difficulty
// 		) {
// 			throw new functions.https.HttpsError(
// 				"invalid-argument",
// 				"Max difficulty must be a number >= Min difficulty"
// 			);
// 		}

// 		if (!(tags instanceof Array)) {
// 			throw new functions.https.HttpsError(
// 				"invalid-argument",
// 				"Tags must be a string[]"
// 			);
// 		}

// 		try {
// 			const taskDocRefs = admin
// 				.firestore()
// 				.collection("tasks")
// 				.orderBy("difficulty")
// 				.limit(limit)
// 				.where("difficulty", ">=", min_difficulty)
// 				.where("difficulty", "<=", max_difficulty);
// 			const taskDocs = await taskDocRefs.get();
// 			const result: Object[] = [];
// 			taskDocs.docs.forEach(doc => {
// 				const data = doc.data();
// 				let valid = true;
// 				tags.forEach((tag: String) => {
// 					if (!data.tags.includes(tag)) {
// 						valid = false;
// 					}
// 				});
// 				if (valid) {
// 					result.push(data);
// 				}
// 			});

// 			res.send(result);
// 		} catch (error) {
// 			throw new functions.https.HttpsError("unknown", error);
// 		}
// 	});

export const getProblemMetadata = functions
	.region("asia-east2")
	.https.onRequest(async (req, res) => {
		res.set("Access-Control-Allow-Origin", "*");
		const problem_id = req.query.id;

		if (!(typeof problem_id === "string")) {
			throw new functions.https.HttpsError(
				"invalid-argument",
				"problem ID must be a string, given problem ID = " + problem_id
			);
		}

		try {
			const taskSnapshot = await admin
				.firestore()
				.collection("tasks")
				.where("problem_id", "==", problem_id)
				.get();
			if (taskSnapshot.docs.length === 0) res.send({});
			else if (taskSnapshot.docs.length === 1) {
				res.send(taskSnapshot.docs[0].data()!);
			} else {
				throw new Error("Duplicate snapshots found!!!");
			}
		} catch (error) {
			throw new functions.https.HttpsError("unknown", error);
		}
	});
