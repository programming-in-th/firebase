import * as admin from "firebase-admin";
admin.initializeApp({
    storageBucket: "grader-ef0b5.appspot.com"
});
// No need to initialize with service account credentials

export * from "./submissions";
export * from "./tasks";
export * from "./learn";
export * from "./users";
