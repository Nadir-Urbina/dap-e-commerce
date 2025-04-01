const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Check for command line arguments
const args = process.argv.slice(2);
if (args.length < 6) {
  console.log('Usage: node create-user-with-token.js <email> <password> <firstName> <lastName> <company> <phone> [role]');
  console.log('Example: node create-user-with-token.js admin@example.com password123 John Doe "Acme Inc" "555-1234" admin');
  process.exit(1);
}

const [email, password, firstName, lastName, company, phone] = args;
// Default to 'customer' role if not specified
const role = args[6] || 'customer';

// Use a service account from Firebase console
try {
  // Get project ID from environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID not set in .env.local file');
    process.exit(1);
  }

  // Initialize the admin app
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });

  const auth = admin.auth();
  const db = admin.firestore();

  // Create the user
  const createUser = async () => {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
      });

      console.log('User created successfully with UID:', userRecord.uid);

      // Create user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        firstName,
        lastName,
        company,
        phone,
        role, // Use the role from args or default
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`User added to Firestore with role: ${role}`);
      console.log('\nUser creation successful!');
      
      // If admin, mention they can log in to the admin dashboard
      if (role === 'admin' || role === 'staff') {
        console.log(`This user can log in to the admin dashboard at: http://localhost:3000/login`);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error creating user:', error);
      process.exit(1);
    }
  };

  createUser();
} catch (error) {
  console.error('Error initializing Firebase:', error);
  process.exit(1);
} 