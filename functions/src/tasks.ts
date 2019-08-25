import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin';

export const getTasksWithFilter = functions.region('asia-east2').https.onCall(async (request_data: any, context: functions.https.CallableContext) => {
	const limit = request_data.limit;
	const min_difficulty = request_data.min_difficulty;
	const max_difficulty = request_data.max_difficulty;
	const tags = request_data.tags;
	try {
		let taskDocRefs = admin.firestore().collection("tasks").orderBy("difficulty").limit(limit);
		if (min_difficulty) {
			taskDocRefs = taskDocRefs.where("difficulty", ">=", min_difficulty);
		}
		if (max_difficulty) {
			taskDocRefs = taskDocRefs.where("difficulty", "<=", max_difficulty);
		}
		const taskDocs = await taskDocRefs.get();
		const result: Object[] = [];
		taskDocs.docs.forEach((doc) => {
			const data = doc.data();
			let valid = true;
			tags.forEach((tag: String) => {
				if (!data.tags.includes(tag)) {
					valid = false;
				}
			});
			if (valid) {
				result.push(data);
			}
		});
		return result;
	} catch (error) {
		throw new functions.https.HttpsError('unknown', 'Query Failed');
	}
});