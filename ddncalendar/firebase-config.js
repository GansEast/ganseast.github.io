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
try {
    firebase.initializeApp(firebaseConfig);
} catch (error) {
    console.log('Firebase already initialized');
}

const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code == 'unimplemented') {
          console.log('The current browser does not support persistence.');
      }
  });