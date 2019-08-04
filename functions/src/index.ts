import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp({ credential: admin.credential.applicationDefault() });
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
// TODO: remove object after testing (empty function parameters)

// TODO: SECURE SENSITIVE DATA BY USING POST INSTEAD OF GET

export const getRecentSubmissions = functions.https.onRequest(async (request, response) => {
	response.set('Access-Control-Allow-Origin', '*');

	if (request.method === 'OPTIONS') {
		// Send response to OPTIONS requests
		response.set('Access-Control-Allow-Methods', 'GET');
		response.set('Access-Control-Allow-Headers', 'Content-Type');
		response.set('Access-Control-Max-Age', '3600');
		response.status(204).send('');
	} else {
		try {
			const submissionDocs = await admin.firestore().collection("submissions").orderBy("timestamp", "desc").limit(parseInt(request.query.limit)).get();
			// Handles GET requests
			const submissions: Object[] = [];
			submissionDocs.docs.forEach((doc) => {
				const data = doc.data();
				data.submission_id = doc.id;
				submissions.push(data);
			});
			response.send(submissions);
		} catch (error) {
			console.log(error);
			response.status(500).send(error);
		}
	}
});

// TODO: get recent forum threads
// TODO: firestore triggers (update score) for leaderboard
// TODO: http triggers for leaderboard

export const getAllTasksWithFilter = functions.https.onRequest(async (request, response) => {
	// Required parameters: limit
	// Optional parameters: min_difficulty, max_difficulty, tags, sort_by (difficulty, problem_id, title)?
	response.set('Access-Control-Allow-Origin', '*');

	if (request.method === 'OPTIONS') {
		// Send response to OPTIONS requests
		response.set('Access-Control-Allow-Methods', 'GET');
		response.set('Access-Control-Allow-Headers', 'Content-Type');
		response.set('Access-Control-Max-Age', '3600');
		response.status(204).send('');
	} else {
		try {
			let taskDocRefs = admin.firestore().collection("tasks").orderBy("difficulty").limit(parseInt(request.query.limit));
			if (request.query.min_difficulty) {
				taskDocRefs = taskDocRefs.where("difficulty", ">=", parseInt(request.query.min_difficulty));
			}
			if (request.query.max_difficulty) {
				taskDocRefs = taskDocRefs.where("difficulty", "<=", parseInt(request.query.max_difficulty));
			}
			const queryTags: String[] = (request.query.tags ? JSON.parse(request.query.tags.toString()) : []);
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
			response.send(result);
		} catch (error) {
			console.log(error);
			response.status(500).send(error);
		}
	}
});

export const getSubmissionsWithFilter = functions.https.onRequest(async (request, response) => {
	// Required parameters: limit
	// Optional parameters: uid, problem_id
	response.set('Access-Control-Allow-Origin', '*');

	if (request.method === 'OPTIONS') {
		// Send response to OPTIONS requests
		response.set('Access-Control-Allow-Methods', 'GET');
		response.set('Access-Control-Allow-Headers', 'Content-Type');
		response.set('Access-Control-Max-Age', '3600');
		response.status(204).send('');
	} else {
		try {
			let submissionDocRefs = admin.firestore().collection("submissions").orderBy("timestamp", "desc").limit(parseInt(request.query.limit));
			if (request.query.uid) {
				submissionDocRefs = submissionDocRefs.where("uid", "==", request.query.uid);
			}
			if (request.query.problem_id) {
				submissionDocRefs = submissionDocRefs.where("problem_id", "==", request.query.problem_id);
			}
			const submissionDocs = await submissionDocRefs.get();
			const result: Object[] = [];
			submissionDocs.docs.forEach((doc) => {
				const data = doc.data();
				result.push(data);
			});
			response.send(result);
		} catch (error) {
			console.log(error);
			response.status(500).send(error);
		}
	}
	// Returns only metadata of submissions (no code, no case results)
});

export const getDetailedSubmissionData = functions.https.onRequest(async (request, response) => {
	// Required parameters: submission_id

	interface SubcaseVerdictPair {
		subcase: number,
		verdict: string
		time: number,
		memory: number,
	}

	response.set('Access-Control-Allow-Origin', '*');

	if (request.method === 'OPTIONS') {
		// Send response to OPTIONS requests
		response.set('Access-Control-Allow-Methods', 'GET');
		response.set('Access-Control-Allow-Headers', 'Content-Type');
		response.set('Access-Control-Max-Age', '3600');
		response.status(204).send('');
	} else {
		try {
			const submissionDocRef = admin.firestore().doc("submissions/" + request.query.submission_id);
			const submissionDoc = await submissionDocRef.get();
			const metadata = submissionDoc.data();
			const caseResultDocs = (await submissionDocRef.collection("status").orderBy("case_id").get()).docs;
			const caseResults: { [key: number]: SubcaseVerdictPair[] } = {};
			if (caseResultDocs.length) {
				caseResultDocs.forEach((doc) => {
					const data = doc.data();
					const [subtaskString, subcaseString] = (data.case_id as string).split("/");
					const [subtask, subcase] = [parseInt(subtaskString), parseInt(subcaseString)];
					const resultObjectToAppend = { subcase: subcase, verdict: data.verdict, time: parseFloat(data.time), memory: parseFloat(data.memory) } as SubcaseVerdictPair;
					if (subtask in caseResults) {
						caseResults[subtask].push(resultObjectToAppend);
					} else {
						caseResults[subtask] = [resultObjectToAppend];
					}
				});
			}
			// Get code file from storage
			const tempPath = path.join(os.tmpdir(), submissionDoc.id);
			await admin.storage().bucket().file("submissions/" + submissionDoc.id).download({ destination: tempPath });
			console.log("Downloaded code file for submission " + submissionDoc.id + " to " + tempPath);
			// TODO: read the file
			let code = "";
			fs.readFile(tempPath, "utf8", (error, data) => {
				if (error) throw error;
				code = data;
				response.send({ metadata: metadata, code: code, case_results: caseResults });
			});
		} catch (error) {
			console.log(error);
			response.status(500).send(error);
		}
	}
	/*
	Returns data as
	{
		metadata: {...}
		code: "" (read from storage)
		case_results: {
			"1" : [
				{"subcase" : "1", "verdict" : "P", "time" : 0.02, "memory", 7624}
				{"subcase" : "2", ...}
				...				
			]
			"2" : [...]
			...
		} (only if collection named 'status' exists. For now, if we're using cafe, it will not exist.)
	}
	* If the submission has not yet been graded, the status will not be "[PPP][...]" but rather "in_queue"
	*/
});

