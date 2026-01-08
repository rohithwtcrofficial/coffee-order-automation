import * as admin from 'firebase-admin';

export async function logEmailToFirestore(params: {
  orderId: string;
  emailType: string;
  recipientEmail: string;
  status: 'success' | 'failed';
  error?: any;
}) {
  const db = admin.firestore(); // ✅ SAFE: after initializeApp

  await db.collection('emailLogs').add({
    orderId: params.orderId,
    emailType: params.emailType,
    recipientEmail: params.recipientEmail,
    status: params.status,
    error: params.error ? String(params.error) : null,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
