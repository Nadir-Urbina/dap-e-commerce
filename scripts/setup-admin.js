const fs = require('fs');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Check command line arguments
if (process.argv.length < 4) {
  console.log('Usage: node setup-admin.js <email> <password>');
  console.log('Example: node setup-admin.js admin@example.com password123');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

async function setupAdmin() {
  try {
    // Create a temporary service account credentials file
    const serviceAccountPath = path.resolve(__dirname, 'service-account-temp.json');
    
    // Create the service account JSON structure
    const serviceAccount = {
      "type": "service_account",
      "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      "private_key": process.env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
      "client_email": `firebase-adminsdk-r1u6y@${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
      "client_id": "",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-r1u6y%40${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
      "universe_domain": "googleapis.com"
    };
    
    // Write the service account to a temp file
    fs.writeFileSync(serviceAccountPath, JSON.stringify(serviceAccount, null, 2));
    console.log(`Created temporary service account file: ${serviceAccountPath}`);
    
    // Initialize Firebase Admin SDK using the service account file
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
    
    console.log('Firebase Admin SDK initialized successfully');

    // Access Firestore and Auth
    const auth = admin.auth();
    const db = admin.firestore();

    // Validate password
    if (password.length < 6) {
      console.error('Error: Password must be at least 6 characters');
      cleanup(serviceAccountPath);
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
    
    // Clean up
    cleanup(serviceAccountPath);
  } catch (error) {
    console.error('Error creating admin user:', error);
    // Clean up service account file even if there's an error
    cleanup(path.resolve(__dirname, 'service-account-temp.json'));
    process.exit(1);
  }
}

function cleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed temporary service account file: ${filePath}`);
    }
  } catch (err) {
    console.error('Error cleaning up temporary file:', err);
  }
}

// Run the setup
setupAdmin(); 