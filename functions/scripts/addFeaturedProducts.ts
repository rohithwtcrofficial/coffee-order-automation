import * as admin from 'firebase-admin';
import featuredProducts from '../src/data/featuredProducts.json'; 
import serviceAccount from '../serviceAccountKey.json';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

async function addFeaturedProducts() {
  await db.collection('featured_products').doc('homepage').set({
    active: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    products: featuredProducts, // ✅ FROM JSON
  });

  console.log('✅ Featured products added successfully');
  process.exit(0);
}

addFeaturedProducts().catch((err) => {
  console.error(err);
  process.exit(1);
});
