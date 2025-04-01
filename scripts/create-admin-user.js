const admin = require('firebase-admin');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin with credentials
try {
  // Instead of trying to parse the service account key, we'll use the project ID from env vars
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  admin.initializeApp({
    projectId: projectId,
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: `firebase-adminsdk-${projectId.substring(0, 6)}@${projectId}.iam.gserviceaccount.com`,
      // Use the private key directly from env
      privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    })
  });

  const auth = admin.auth();
  const db = admin.firestore();

  // Create interface for reading user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Prompt for user details
  const promptUser = () => {
    return new Promise((resolve) => {
      const userDetails = {};

      rl.question('Email: ', (email) => {
        userDetails.email = email;

        rl.question('Password (min 6 characters): ', (password) => {
          userDetails.password = password;

          rl.question('First Name: ', (firstName) => {
            userDetails.firstName = firstName;

            rl.question('Last Name: ', (lastName) => {
              userDetails.lastName = lastName;

              rl.question('Company: ', (company) => {
                userDetails.company = company;

                rl.question('Phone: ', (phone) => {
                  userDetails.phone = phone;
                  resolve(userDetails);
                });
              });
            });
          });
        });
      });
    });
  };

  // Create the admin user
  const createAdminUser = async () => {
    try {
      console.log('\n=== Create Admin User ===');
      const userDetails = await promptUser();

      // Validate password
      if (userDetails.password.length < 6) {
        console.error('Error: Password must be at least 6 characters long');
        rl.close();
        process.exit(1);
      }

      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: userDetails.email,
        password: userDetails.password,
        displayName: `${userDetails.firstName} ${userDetails.lastName}`,
      });

      console.log('User created successfully:', userRecord.uid);

      // Create user document in Firestore with admin role
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userDetails.email,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        company: userDetails.company,
        phone: userDetails.phone,
        role: 'admin', // Set role as admin
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('Admin user added to Firestore database');
      console.log('\nAdmin creation successful! The user can now log in with:');
      console.log(`Email: ${userDetails.email}`);
      console.log(`Password: ${userDetails.password}`);

      rl.close();
    } catch (error) {
      console.error('Error creating admin user:', error);
      rl.close();
      process.exit(1);
    }
  };

  createAdminUser();
} catch (error) {
  console.error('Error initializing Firebase:', error);
  process.exit(1);
} 