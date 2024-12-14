import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // or .cert() with a service account
        storageBucket: 'gym-monitor.appspot.com',
    });
}

export default admin;