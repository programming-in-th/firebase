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
