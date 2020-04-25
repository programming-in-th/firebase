import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export const readCode = async (id: string) => {
	try {
		const submissionDoc = await admin
			.firestore()
			.doc("submissions/" + id)
			.get();
		// Get code file from storage
		const tempPath = path.join(os.tmpdir(), submissionDoc.id);
		await admin
			.storage()
			.bucket()
			.file("submissions/" + submissionDoc.id)
			.download({ destination: tempPath });
		// console.log("Downloaded code file for submission " + submissionDoc.id + " to " + tempPath)
		// Read the file
		const code: string = fs.readFileSync(tempPath, { encoding: "utf8" });
		return code;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export const writeCode = async (id: string, code: Array<string>) => {
	console.log(id, code);
	try {
		for (var i = 0; i < code.length; i++) {
			const tempPath = path.join(os.tmpdir(), i.toString());
			fs.writeFileSync(tempPath, code[i]);
			// Upload file to storage
			const bucket = admin.storage().bucket();
			await bucket.upload(tempPath, {
				destination: "submissions/" + id + "/" + i.toString(),
			});
		}
	} catch (error) {
		console.log(error);
		throw error;
	}
};
