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
		const result = await getRecentSubmissions(parseInt(request.query.limit));
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

app.get('/getSubmissionsWithFilter', async (request: any, response: any) => {
	try {
		const result = await getSubmissionsWithFilter(parseInt(request.query.limit), request.query.uid, request.query.problem_id);
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

app.get('/getDetailedSubmissionData', async (request: any, response: any) => {
	try {
		const result = await getDetailedSubmissionData(request.query.submission_id);
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

app.get('/getOldestUngradedSubmission', async (request: any, response: any) => {
	try {
		const result = await getOldestUngradedSubmission(request.query.problem_id);
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

// POST requests must use body property instead of query
app.post('/makeSubmission', async (request: any, response: any) => {
	try {
		await makeSubmission(request.body.uid, request.body.problem_id, request.body.code, request.body.language);
		response.send('Successfully submitted');
	} catch (error) {
		response.status(500).send(error);
	}
});

// TODO: PATCH (PUT) the submission results from juding server

/* TASKS RELATED FUNCTIONS */

app.get('/getTasksWithFilter', async (request: any, response: any) => {
	try {
		const result = await getTasksWithFilter(parseInt(request.query.limit), parseInt(request.query.min_difficulty), parseInt(request.query.max_difficulty), request.query.tags);
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

export default app;
