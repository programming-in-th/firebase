import * as admin from "firebase-admin";
import * as unzipper from "unzipper";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

const readFile = async (filePath: string) => {
	try {
		const tempPath = path.join(os.tmpdir(), "temp");
		const tempFile = admin.storage().bucket().file(filePath);
		const status = await tempFile.exists();
		if (status[0] === false) return "";
		await tempFile.download({ destination: tempPath });
		const code = fs.readFileSync(tempPath, {
			encoding: "utf8",
		});
		return code;
	} catch (error) {
		throw error;
	}
};

export const readCode = async (id: string) => {
	try {
		const submissionDoc = await admin
			.firestore()
			.doc(`submissions/${id}`)
			.get();
		const taskDoc = submissionDoc.data()?.task;
		const type = taskDoc.type;
		let len = 1;
		if (type !== "normal") {
			len = taskDoc.fileName.length;
		}
		const responseCode = [];
		for (var i = 0; i < len; ++i) {
			const code = await readFile(`submissions/${id}/${i.toString()}`);
			responseCode.push(code);
		}
		return responseCode;
	} catch (error) {
		throw error;
	}
};

export const writeCode = async (id: string, code: Array<string>) => {
	try {
		for (var i = 0; i < code.length; ++i) {
			const tempPath = path.join(os.tmpdir(), i.toString());
			fs.writeFileSync(tempPath, code[i]);
			const bucket = admin.storage().bucket();
			await bucket.upload(tempPath, {
				destination: `submissions/${id}/${i.toString()}`,
			});
		}
	} catch (error) {
		throw error;
	}
};

const makeid = (length: number) => {
	var result = "";
	var characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(
			Math.floor(Math.random() * charactersLength)
		);
	}
	return result;
};

export const unzipCode = async (code: string, probID: string) => {
	try {
		const id = makeid(20);
		const bucket = admin.storage().bucket();
		const tempZpath = path.join(os.tmpdir(), "file.zip");
		fs.writeFileSync(tempZpath, code, "base64");
		await bucket.upload(tempZpath, {
			destination: `${id}/file.zip`,
		});
		const zipFile = bucket.file(`${id}/file.zip`);
		await zipFile
			.createReadStream()
			.pipe(unzipper.Parse())
			.on("entry", (entry: any) => {
				const destination = bucket.file(`${id}/${entry.path}`);
				entry.pipe(destination.createWriteStream());
			})
			.promise();
		const returnArray: Array<string> = [];
		const taskSnapshot = await admin
			.firestore()
			.collection("tasks")
			.where("id", "==", probID)
			.get();
		if (taskSnapshot.docs.length === 1) {
			const data = taskSnapshot.docs[0].data();
			for (const element of data.fileName) {
				const readCode = await readFile(`${id}/${element}`);
				returnArray.push(readCode);
			}
			await bucket.deleteFiles({
				prefix: `${id}/`,
			});
			return returnArray;
		} else {
			throw new Error("Problem with Task");
		}
	} catch (error) {
		throw error;
	}
};
