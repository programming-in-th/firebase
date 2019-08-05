const express = require('express');
const cors = require('cors');

import { getTasksWithFilter } from './model/tasks';
import { getRecentSubmissions, getSubmissionsWithFilter, getDetailedSubmissionData, getOldestUngradedSubmission, makeSubmission } from './model/submissions';

const app = express();
app.use(cors({ origin: true }));
// WARNING: Doesn't work with credentials?

/* SUBMISSION RELATED FUNCTIONS */
app.get('/getRecentSubmissions', async (request: any, response: any) => {
	try {
		const result = await getRecentSubmissions(parseInt(request.body.limit));
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

app.get('/getSubmissionsWithFilter', async (request: any, response: any) => {
	try {
		const result = await getSubmissionsWithFilter(parseInt(request.body.limit), request.uid, request.problem_id);
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

app.get('/getDetailedSubmissionData', async (request: any, response: any) => {
	try {
		const result = await getDetailedSubmissionData(request.body.submission_id);
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

app.get('/getOldestUngradedSubmission', async (request: any, response: any) => {
	try {
		const result = await getOldestUngradedSubmission(request.body.problem_id);
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

app.post('/makeSubmission', async (request: any, response: any) => {
	try {
		await makeSubmission(request.body.uid, request.body.problem_id, request.body.code, request.body.language);
		response.send('Successfully submitted');
	} catch (error) {
		response.status(500).send(error);
	}
});

/* TASKS RELATED FUNCTIONS */

app.get('/getTasksWithFilter', async (request: any, response: any) => {
	try {
		const result = await getTasksWithFilter(parseInt(request.body.limit), parseInt(request.body.min_difficulty), parseInt(request.body.max_difficulty), request.body.tags);
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

export default app;