import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const checkAdmin = async (context: functions.https.CallableContext) => {
	if (!context.auth) return false;
	const uid = context.auth ? context.auth.uid : "";
	if (!(typeof uid === "string")) {
		throw new functions.https.HttpsError(
			"invalid-argument",
			"admin UID must be a string, given UID = " + uid
		);
	}
	try {
		const userSnapshot = await admin
			.firestore()
			.collection("users")
			.doc(uid)
			.get();
		if (!userSnapshot.exists) return false;
		return userSnapshot.data()!.admin;
	} catch (error) {
		throw new functions.https.HttpsError("unknown", error);
	}
};

export const getIsAdmin = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			return checkAdmin(context);
		}
	);

export const getAllUser = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return;
			try {
				const userSnapShot = admin.firestore().collection("users");
				const userDoc = await userSnapShot.get();
				const userListRaw = await admin.auth().listUsers();
				const userList: Object[] = [];
				const map = new Map();
				userDoc.docs.forEach(val => {
					map.set(val.data().uid, val.data().admin);
				});
				userListRaw.users.forEach(record => {
					const nowdata = record.toJSON();
					(nowdata as any).admin = map.get((nowdata as any).uid);
					userList.push(nowdata);
				});
				return userList;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);

export const updateAdmin = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return false;
			const uid = request_data.uid;
			const checked = request_data.checked;
			try {
				const docRef = admin
					.firestore()
					.collection("users")
					.doc(uid);
				const doc = await docRef.get();
				if (!doc.exists)
					throw new functions.https.HttpsError(
						"invalid-argument",
						"uid not found"
					);
				await docRef.update({ admin: checked });
				return true;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);

// only onCall This functioin

export const getAdminTask = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return false;
			try {
				const taskRef = admin
					.firestore()
					.collection("tasks")
					.orderBy("problem_id");
				const allTask = await taskRef.get();
				const ret: Object[] = [];
				allTask.docs.forEach(val => {
					const data = val.data();
					data.uid = val.id;
					ret.push(data);
				});
				return ret;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);

// taskList : {uid: string, visible: boolean} => array of object[]

export const editTaskView = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return false;
			request_data.forEach((element: any) => {
				if (!(typeof element.uid === "string")) {
					throw new functions.https.HttpsError(
						"invalid-argument",
						"uid must be string"
					);
				}
				if (!(typeof element.visible === "boolean")) {
					throw new functions.https.HttpsError(
						"invalid-argument",
						"visible must be boolean"
					);
				}
			});
			try {
				request_data.forEach(async (element: any) => {
					const docRef = admin
						.firestore()
						.collection("tasks")
						.doc(element.uid);
					const doc = await docRef.get();
					if (!doc.exists)
						throw new functions.https.HttpsError(
							"invalid-argument",
							"uid not found"
						);
					await docRef.update({ visible: element.visible });
				});
				return true;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);

// {{uid: string, visible: boolean}} => array of object

export const editTaskSubmit = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return false;
			request_data.forEach((element: any) => {
				if (!(typeof element.uid === "string")) {
					throw new functions.https.HttpsError(
						"invalid-argument",
						"uid must be string"
					);
				}
				if (!(typeof element.visible === "boolean")) {
					throw new functions.https.HttpsError(
						"invalid-argument",
						"visible must be boolean"
					);
				}
			});
			try {
				request_data.forEach(async (element: any) => {
					const docRef = admin
						.firestore()
						.collection("tasks")
						.doc(element.uid);
					const doc = await docRef.get();
					if (!doc.exists)
						throw new functions.https.HttpsError(
							"invalid-argument",
							"uid not found"
						);
					await docRef.update({ submit: element.visible });
				});
				return true;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);

// {uid: string, id: string }

export const editTaskID = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return false;
			if (!(typeof request_data.uid === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"uid must be string"
				);
			}
			if (!(typeof request_data.id === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"id must be string"
				);
			}
			try {
				const docRef = admin
					.firestore()
					.collection("tasks")
					.doc(request_data.uid);
				const doc = await docRef.get();
				if (!doc.exists)
					throw new functions.https.HttpsError(
						"invalid-argument",
						"uid not found"
					);
				await docRef.update({ problem_id: request_data.id });
				return true;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);

// {uid: string, title: string }

export const editTaskTitle = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return false;
			if (!(typeof request_data.uid === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"uid must be string"
				);
			}
			if (!(typeof request_data.id === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"id must be string"
				);
			}
			try {
				const docRef = admin
					.firestore()
					.collection("tasks")
					.doc(request_data.uid);
				const doc = await docRef.get();
				if (!doc.exists)
					throw new functions.https.HttpsError(
						"invalid-argument",
						"uid not found"
					);
				await docRef.update({ title: request_data.title });
				return true;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);

// string => array of uid

export const deleteTask = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return false;
			if (!(typeof request_data === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"uid must be string"
				);
			}
			try {
				const docRef = admin
					.firestore()
					.collection("tasks")
					.doc(request_data);
				const doc = await docRef.get();
				if (!doc.exists)
					throw new functions.https.HttpsError(
						"invalid-argument",
						"uid not found"
					);
				await docRef.delete();
				return true;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);

// obj of task  => only one task
// {
// 	dfficulty: number,
// 	memory_limit: number,
// 	problem_id: string,
// 	source: string,
// 	tags: Array<string>,
// 	time_limit: number,
// 	title: string,
// 	url: string
// }
export const addTask = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			console.log(request_data);
			console.log(typeof request_data.difficulty);
			if (!(typeof request_data.difficulty === "number")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"difficulty must be number"
				);
			}
			if (!(typeof request_data.memory_limit === "number")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"memory limit must be number"
				);
			}
			if (!(typeof request_data.time_limit === "number")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"time limit must be number"
				);
			}
			if (!(typeof request_data.problem_id === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"problem id must be string"
				);
			}
			if (!(typeof request_data.source === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"source must be string"
				);
			}
			if (!(typeof request_data.title === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"title must be string"
				);
			}
			if (!(typeof request_data.url === "string")) {
				throw new functions.https.HttpsError(
					"invalid-argument",
					"url must be string"
				);
			}
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return false;
			request_data.solve_count = 0;
			request_data.visible = false;
			request_data.submit = false;
			try {
				const docRef = await admin
					.firestore()
					.collection("tasks")
					.add(request_data);
				return docRef.id;
			} catch (error) {
				throw new functions.https.HttpsError("unknown", error);
			}
		}
	);
