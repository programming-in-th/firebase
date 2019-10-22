import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const getLearnMenu = functions
    .region("asia-east2")
    .https.onCall(
        async (request_data: any, context: functions.https.CallableContext) => {
            interface INode {
                readonly name: string;
                readonly type: string;
                readonly article_id?: string;
                readonly url?: string;
                readonly articles?: INode[];
            }

            try {
                const node_query = await admin
                    .firestore()
                    .collection("tutorials")
                    .get();
                const nodes: INode[] = [];
                for (const doc of node_query.docs) {
                    const data = doc.data();
                    if (data.type === "section") {
                        const sub_node_query = await doc.ref
                            .collection("articles")
                            .get();
                        const articles: INode[] = [];
                        for (const sub_doc of sub_node_query.docs) {
                            const sub_data = sub_doc.data();
                            articles.push({
                                name: sub_data.name as string,
                                type: sub_data.type as string,
                                article_id: sub_data.article_id as string,
                                url: sub_data.url as string
                            });
                        }
                        nodes.push({
                            name: data.name as string,
                            type: data.type as string,
                            articles: articles
                        });
                    } else if (data.type === "article") {
                        nodes.push({
                            name: data.name as string,
                            type: data.type as string,
                            article_id: data.article_id as string,
                            url: data.url as string
                        });
                    } else {
                        throw new functions.https.HttpsError(
                            "unknown",
                            "Incorrect type"
                        );
                    }
                }
                return nodes;
            } catch (error) {
                throw new functions.https.HttpsError("unknown", error);
            }
        }
    );

export const getArticleByID = functions
    .region("asia-east2")
    .https.onCall(
        async (request_data: any, context: functions.https.CallableContext) => {
            try {
                const article_id = request_data.article_id as string;
                const splitted = article_id.split('`');
                if (splitted.length === 2) {
                    const section_id = splitted[0];
                    const section_doc = await admin
                        .firestore()
                        .collection("tutorials")
                        .where("section_id", "==", section_id)
                        .get();
                    console.log(section_doc.docs[0].data());
                    const article_doc = await section_doc.docs[0].ref
                        .collection("articles")
                        .where("article_id", "==", article_id)
                        .get();
                    return article_doc.docs[0].data();
                } else {
                    const article_doc = await admin
                        .firestore()
                        .collection("tutorials")
                        .where("article_id", "==", article_id)
                        .get();
                    return article_doc.docs[0].data();
                }
            } catch (error) {
                throw new functions.https.HttpsError("unknown", error);
            }
        }
    );
