import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const dukaanWebhookTest = functions.https.onRequest(
  async (req, res): Promise<void> => {
    if (req.method !== "POST") {
      res.status(405).send("POST only");
      return;
    }

    console.log("Dukaan Webhook TEST payload:");
    console.log(JSON.stringify(req.body, null, 2));

    await admin.firestore().collection("dukaan_webhook_tests").add({
      headers: req.headers,
      body: req.body,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send("Test webhook received");
    return;
  }
);
