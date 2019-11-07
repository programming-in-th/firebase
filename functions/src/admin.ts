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
			await admin
				.firestore()
				.collection("users")
				.doc(uid)
				.update({ admin: checked });
			return true;
		}
	);

// only onCall This functioin

export const getAdminTask = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return;
			const taskRef = admin.firestore().collection("tasks");
			const allTask = await taskRef.get();
			const ret: Object[] = [];
			allTask.docs.forEach(val => {
				ret.push(val.data());
			});
			return ret;
		}
	);

// taskList : {uid: string, visible: boolean} => array of object[]

export const editTaskView = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return;
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
			request_data.forEach(async (element: any) => {
				await admin
					.firestore()
					.collection("tasks")
					.doc(element.uid)
					.update({ visible: element.visible });
			});
		}
	);

// {{uid: string, visible: boolean}} => array of object

export const editTaskSubmit = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return;
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
			request_data.forEach(async (element: any) => {
				await admin
					.firestore()
					.collection("tasks")
					.doc(element.uid)
					.update({ submit: element.visible });
			});
		}
	);

// {string} => array of uid

export const deleteTask = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			const isAdmin = await checkAdmin(context);
			if (!isAdmin) return;
			request_data.forEach((element: any) => {
				if (!(typeof element === "string")) {
					throw new functions.https.HttpsError(
						"invalid-argument",
						"uid must be string"
					);
				}
			});
			request_data.forEach(async (element: any) => {
				await admin
					.firestore()
					.collection("tasks")
					.doc(element)
					.delete();
			});
		}
	);

// obj of task  => only one task
// {
// 	dfficulty: number,
// 	memory_limit: number,
// 	problem_id: string,
// 	source: string,
// 	tag: Array<string>,
// 	time_limit: number,
// 	title: string,
// 	url: string
// }
export const addTask = functions
	.region("asia-east2")
	.https.onCall(
		async (request_data: any, context: functions.https.CallableContext) => {
			if (!(typeof request_data.dfficulty === "number")) {
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
			const uid = await admin
				.firestore()
				.collection("tasks")
				.add(request_data);
			return uid;
		}
	);
