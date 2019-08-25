import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Timestamp } from '@google-cloud/firestore';

export const getRecentSubmissions = functions.region('asia-east2').https.onCall(async (request_data: any, context: functions.https.CallableContext) => {
	const limit = request_data.limit;
	if (!(typeof limit === 'number') || limit <= 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Limit must be a number > 0');
	}
	try {
		const submissionDocs = await admin.firestore().collection("submissions").orderBy("timestamp", "desc").limit(limit).get();
		// Handles GET requests
		const submissions: Object[] = [];
		submissionDocs.docs.forEach((doc) => {
			const data = doc.data();
			data.submission_id = doc.id;
			submissions.push(data);
		});
		return submissions;
	} catch (error) {
		throw new functions.https.HttpsError('unknown', 'Query Failed');
	}
})

export const getSubmissionsWithFilter = functions.region('asia-east2').https.onCall(async (request_data: any, context: functions.https.CallableContext) => {
	const limit = request_data.limit;
	const uid = request_data.uid;
	const problem_id = request_data.problem_id;
	if (!(typeof limit === 'number') || limit <= 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Limit must be a number > 0');
	}
	if (!(typeof uid === 'string')) {
		throw new functions.https.HttpsError('invalid-argument', 'UID must be a string');
	}
	if (!(typeof problem_id === 'string')) {
		throw new functions.https.HttpsError('invalid-argument', 'Problem ID must be a string');
	}
	try {
		let submissionDocRefs = admin.firestore().collection("submissions").orderBy("timestamp", "desc").limit(limit);
		if (uid) {
			submissionDocRefs = submissionDocRefs.where("uid", "==", uid);
		}
		if (problem_id) {
			submissionDocRefs = submissionDocRefs.where("problem_id", "==", problem_id);
		}
		const submissionDocs = await submissionDocRefs.get();
		const result: Object[] = [];
		submissionDocs.docs.forEach((doc) => {
			const data = doc.data();
			data.submission_id = doc.id;
			result.push(data);
		});
		return result;
	} catch (error) {
		throw new functions.https.HttpsError('unknown', 'Query Failed');
	}
})

export const getCode = functions.region('asia-east2').https.onCall(async (request_data: any, context: functions.https.CallableContext) => {
	const submission_id = request_data.submission_id;
	if (!(typeof submission_id === 'string') || submission_id.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Submission ID must be a non-empty string');
	}
	try {
		const submissionDoc = await admin.firestore().doc("submissions/" + submission_id).get();
		// Get code file from storage
		const tempPath = path.join(os.tmpdir(), submissionDoc.id);
		await admin.storage().bucket().file("submissions/" + submissionDoc.id).download({ destination: tempPath });
		console.log("Downloaded code file for submission " + submissionDoc.id + " to " + tempPath);
		// Read the file
		const code: string = fs.readFileSync(tempPath, { encoding: "utf8" });
		return code;
	} catch (error) {
		throw new functions.https.HttpsError('unknown', 'Query Failed');
	}
})

export const getDetailedSubmissionData = functions.region('asia-east2').https.onCall(async (request_data: any, context: functions.https.CallableContext) => {
	interface SubcaseVerdictPair {
		subcase: number,
		verdict: string
		time: number,
		memory: number,
	}
	const submission_id = request_data.submission_id;
	if (!(typeof submission_id === 'string') || submission_id.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Submission ID must be a non-empty string');
	}
	try {
		const submissionDocRef = admin.firestore().doc("submissions/" + submission_id);
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
		// Read the file
		const code: string = fs.readFileSync(tempPath, { encoding: "utf8" });
		const result = { metadata: metadata, code: code, case_results: caseResults };
		return result;
	} catch (error) {
		throw new functions.https.HttpsError('unknown', 'Query Failed');
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
})

export const getOldestSubmissionInQueue = functions.region('asia-east2').https.onCall(async (request_data: any, context: functions.https.CallableContext) => {
	const problem_id = request_data.problem_id;
	if (!(typeof problem_id === 'string') || problem_id.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Problem ID must be a non-empty string');
	}
	try {
		let queryRef = admin.firestore().collection('submissions')
			.orderBy('timestamp')
			.limit(1)
			.where('status', '==', 'in_queue');
		if (problem_id) {
			queryRef = queryRef.where('problem_id', '==', problem_id);
		}
		const submissionDocs = (await queryRef.get()).docs;
		if (submissionDocs.length !== 0) {
			return submissionDocs[0].data();
		} else {
			return {};
		}
	} catch (error) {
		throw new functions.https.HttpsError('unknown', 'Query failed');
	}
})

export const makeSubmission = functions.region('asia-east2').https.onCall(async (request_data: any, context: functions.https.CallableContext) => {
	const uid = request_data.uid;
	const problem_id = request_data.problem_id;
	const code = request_data.code;
	const language = request_data.language;
	if(!(typeof uid === 'string') || uid.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'UID must be a non-empty string');
	}
	if(!(typeof problem_id === 'string') || problem_id.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Problem ID must be a non-empty string');
	}
	if(!(typeof code === 'string') || code.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Code must be a non-empty string');
	}
	if(!(typeof language === 'string') || language.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Language must be a non-empty string');
	}
	if(!context.auth || context.auth.uid !== uid) {
		throw new functions.https.HttpsError('permission-denied', 'Unauthorized to make submission');
	}
	// NOTE: All undefined numerical values are default set to -1
	try {
		// Get username for user id
		const username = (await admin.firestore().collection('users').doc(uid).get()).data()!.username;
		// Create new submission entry in Firestore
		const submissionID = (await admin.firestore().collection('submissions').add({
			language: language,
			memory: -1,
			points: -1,
			problem_id: problem_id,
			status: "in_queue",
			time: -1,
			timestamp: Timestamp.now(),
			uid: uid,
			username: username,
		})).id;
		// Write code to tmp file
		const tempPath = path.join(os.tmpdir(), submissionID);
		fs.writeFileSync(tempPath, code);
		// Upload file to storage
		const bucket = admin.storage().bucket();
		await bucket.upload(tempPath, {
			destination: 'submissions/' + submissionID,
		});
	} catch (error) {
		throw new functions.https.HttpsError('unknown', 'Query failed');
	}
})

export const updateSubmissionStatus = functions.region('asia-east2').https.onCall(async (request_data: any, context: functions.https.CallableContext) => {
	const submission_id = request_data.submission_id;
	const status = request_data.status;
	const points = request_data.points;
	const time = request_data.time;
	const memory = request_data.memory;
	if(!(typeof submission_id === 'string') || submission_id.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Submission ID must be a non-empty string');
	}
	if(!(typeof status === 'string') || status.length === 0) {
		throw new functions.https.HttpsError('invalid-argument', 'Status must be a non-empty string');
	}
	if(!(typeof points === 'number')) {
		throw new functions.https.HttpsError('invalid-argument', 'Points must be a number');
	}
	if(!(typeof time === 'number')) {
		throw new functions.https.HttpsError('invalid-argument', 'Time must be a number');
	}
	if(!(typeof memory === 'number')) {
		throw new functions.https.HttpsError('invalid-argument', 'Memory must be a number');
	}
	try {
		const submissionDocRef = admin.firestore().collection('submissions').doc(submission_id);
		await submissionDocRef.update({
			points: points,
			status: status,
			time: time,
			memory: memory
		});
	} catch (error) {
		throw new functions.https.HttpsError('unknown', 'Query failed');
	}
})