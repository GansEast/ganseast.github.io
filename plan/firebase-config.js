// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAMvlkTL3XAcZ2h3SkjQk6ZItySv7vwvRw",
    authDomain: "ddncalendar-877ba.firebaseapp.com",
    projectId: "ddncalendar-877ba",
    storageBucket: "ddncalendar-877ba.firebasestorage.app",
    messagingSenderId: "974326246198",
    appId: "1:974326246198:web:6b350cd6d476e855b7a197"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
      console.log('Firebase persistence error: ', err);
  });