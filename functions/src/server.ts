const express = require('express');
const cors = require('cors');

import { getTasksWithFilter } from './model/tasks';
import { getRecentSubmissions, getSubmissionsWithFilter, getDetailedSubmissionData, getOldestSubmissionInQueue, makeSubmission, updateSubmissionStatus } from './model/submissions';

const app = express();
app.use(cors({ origin: true }));

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

app.get('/getOldestSubmissionInQueue', async (request: any, response: any) => {
	try {
		const result = await getOldestSubmissionInQueue(request.query.problem_id);
		response.send(result);
	} catch (error) {
		response.status(500).send(error);
	}
});

// POST requests must use body property instead of query
app.post('/makeSubmission', async (request: any, response: any) => {
	try {
		await makeSubmission(request.body.uid, request.body.problem_id, request.body.code, request.body.language);
    response.status(200).send();
	} catch (error) {
		response.status(500).send(error);
	}
});

app.patch('/updateSubmissionStatus', async (request: any, response: any) => {
  try {
    await updateSubmissionStatus(request.body.submission_id,
                                 parseInt(request.body.points),
                                 request.body.status,
                                 parseInt(request.body.time),
                                 parseInt(request.body.memory));
    response.status(200).send();
  } catch (error) {
    response.status(500).send(error);
  }
});

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
