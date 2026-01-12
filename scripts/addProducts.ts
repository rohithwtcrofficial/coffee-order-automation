import admin from "firebase-admin";
import { readFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

/* -------------------- FIX __dirname (ESM) -------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------- LOAD SERVICE ACCOUNT -------------------- */
const serviceAccount = JSON.parse(
  readFileSync(
    path.join(__dirname, "../serviceAccountKey.json"),
    "utf-8"
  )
);

/* -------------------- INIT FIREBASE -------------------- */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/* -------------------- LOAD PRODUCTS JSON -------------------- */
const products = [JSON.parse(readFileSync("./products.json", "utf-8"))];


/* -------------------- INSERT PRODUCTS -------------------- */
async function addProducts() {
  for (const product of products) {
    const now = admin.firestore.FieldValue.serverTimestamp();

    const formattedProduct = {
      ...product,
      descriptionSections: product.descriptionSections?.map((section: any) => ({
        id: uuidv4(), // ✅ auto section ID
        title: section.title,
        points: section.points,
      })) ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("products").add(formattedProduct);
    console.log(`✅ Added product: ${docRef.id}`);
  }
}

addProducts()
  .then(() => {
    console.log("🎉 All products inserted successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error inserting products:", err);
    process.exit(1);
  });
