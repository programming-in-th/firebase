import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Timestamp } from '@google-cloud/firestore';

export const getRecentSubmissions = async (limit: number) => {
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
		throw error;
	}
}

export const getSubmissionsWithFilter = async (limit: number, uid: string, problem_id: string) => {
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
		result.push(data);
	});
	return result;
}

export const getDetailedSubmissionData = async (submission_id: string) => {
	interface SubcaseVerdictPair {
		subcase: number,
		verdict: string
		time: number,
		memory: number,
	}
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
	// TODO: test if this works
	const code:string = fs.readFileSync(tempPath, { encoding: "utf8" });
	const result = { metadata: metadata, code: code, case_results: caseResults };
	return result;
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
}

export const getOldestUngradedSubmission = async (problem_id: string) => {
	try {
		const queryRef = admin.firestore().collection('submissions')
			.orderBy('timestamp')
			.limit(1)
			.where('problem_id', '==', problem_id)
			.where('status', '==', 'in_queue');
		const submissionDocs = (await queryRef.get()).docs;
		return submissionDocs[0].data();
	} catch (error) {
		throw error;
	}
}

export const makeSubmission = async (uid: string, problem_id: string, code: string, language: string) => {
	// NOTE: All undefined numerical values are default set to -1
	try {
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
		})).id;
		// Write code to tmp file
		// TODO: test if this works
		const tempPath = path.join(os.tmpdir(), submissionID);
		fs.writeFileSync(tempPath, code);
		// Upload file to storage
		const bucket = admin.storage().bucket();
		await bucket.upload(tempPath, {
			destination: 'submissions/' + submissionID,
		});
	} catch (error) {
		throw error;
	}
}