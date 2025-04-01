const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Check command line arguments
if (process.argv.length < 4) {
  console.log('Usage: node create-admin.js <email> <password>');
  console.log('Example: node create-admin.js admin@example.com password123');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

// Initialize Firebase Admin SDK using environment variables directly
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: `firebase-adminsdk-r1u6y@${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
      privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
    })
  });

  const auth = admin.auth();
  const db = admin.firestore();

  const createAdminUser = async () => {
    try {
      // Validate password
      if (password.length < 6) {
        console.error('Error: Password must be at least 6 characters');
        process.exit(1);
      }

      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: "Admin User"
      });

      console.log('User created with UID:', userRecord.uid);

      // Set user as admin in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: email,
        firstName: "Admin",
        lastName: "User",
        company: "Duval Asphalt",
        phone: "",
        role: 'admin', // Admin role
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('Admin user created successfully!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log('You can now log in at http://localhost:3000/login');
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  };

  createAdminUser();
} catch (error) {
  console.error('Error initializing Firebase:', error);
} 