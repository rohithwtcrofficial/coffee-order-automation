import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Load service account
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "./serviceAccountKey.json"))
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Get structure of one sample document for each collection
 */
async function getStructureForAllCollections() {
  console.log("🔍 Fetching all collections...\n");

  const collections = await db.listCollections();

  for (const coll of collections) {
    console.log(`\n📁 Collection: ${coll.id}`);

    const snapshot = await coll.limit(1).get();

    if (snapshot.empty) {
      console.log("   ⚠️ No documents found.");
      continue;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    console.log(`   📄 Sample Document ID: ${doc.id}`);
    console.log("   🧱 Fields:");

    for (const field in data) {
      console.log(
        `    - ${field} (${detectType(data[field])}):`,
        formatValue(data[field])
      );
    }

    // 🔽 Subcollections
    const subcollections = await doc.ref.listCollections();

    if (subcollections.length > 0) {
      console.log("   📂 Subcollections:");

      for (const sub of subcollections) {
        console.log(`     ▸ ${sub.id}`);

        const subSnap = await sub.limit(1).get();

        if (subSnap.empty) {
          console.log("        ⚠️ No documents found.");
          continue;
        }

        const subDoc = subSnap.docs[0];
        const subData = subDoc.data();

        console.log(`        📄 Sample Document ID: ${subDoc.id}`);
        console.log("        🧱 Fields:");

        for (const field in subData) {
          console.log(
            `         - ${field} (${detectType(subData[field])}):`,
            formatValue(subData[field])
          );
        }
      }
    }
  }
}

/**
 * Detect Firestore data type
 */
function detectType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value instanceof admin.firestore.Timestamp) return "timestamp";
  if (value instanceof admin.firestore.DocumentReference) return "reference";
  if (typeof value === "object") return "object";
  return typeof value;
}

/**
 * Format Firestore values for readable output
 */
function formatValue(value) {
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof admin.firestore.DocumentReference) {
    return value.path;
  }

  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return value;
}

// Run
getStructureForAllCollections()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
