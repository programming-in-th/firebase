import * as admin from "firebase-admin";
admin.initializeApp({
	storageBucket: "prginth.appspot.com",
});
// No need to initialize with service account credentials

export * from "./submissions";
export * from "./tasks";
export * from "./users";
export * from "./admin";
