const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const ROOT_COLLECTION = 'arbitron';
const app = initializeApp({
  credential: cert({
    clientEmail: process.env.FIREBASE__CLIENT_EMAIL,
    privateKey: process.env.FIREBASE__PRIVATE_KEY,
    projectId: process.env.FIREBASE__PROJECT_ID,
  }),
});
const db = getFirestore(app);

module.exports = {
  ROOT_COLLECTION,
  db,
};
