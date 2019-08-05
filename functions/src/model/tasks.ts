import * as admin from 'firebase-admin';

export const getTasksWithFilter = async (limit: number, min_difficulty: number, max_difficulty: number, tags_JSON: string) => {
	let taskDocRefs = admin.firestore().collection("tasks").orderBy("difficulty").limit(limit);
	if (min_difficulty) {
		taskDocRefs = taskDocRefs.where("difficulty", ">=", min_difficulty);
	}
	if (max_difficulty) {
		taskDocRefs = taskDocRefs.where("difficulty", "<=", max_difficulty);
	}
	const queryTags: String[] = (tags_JSON ? JSON.parse(tags_JSON.toString()) : []);
	const taskDocs = await taskDocRefs.get();
	const result: Object[] = [];
	taskDocs.docs.forEach((doc) => {
		const data = doc.data();
		let valid = true;
		queryTags.forEach((tag: String) => {
			if (!data.tags.includes(tag)) {
				valid = false;
			}
		});
		if (valid) {
			result.push(data);
		}
	});
	return result;
}