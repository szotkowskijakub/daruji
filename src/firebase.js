// src/firebase.js
   import { initializeApp } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';

   const firebaseConfig = {
     apiKey: "AIzaSyBU-WXC5-sZKiMXT4BtpcuqxN31kiaqnI8",
     authDomain: "daruji-c7539.firebaseapp.com",
     projectId: "daruji-c7539",
     storageBucket: "daruji-c7539.firebasestorage.app",
     messagingSenderId: "235105832530",
     appId: "1:235105832530:web:48f66430c65df088fd198b"
   };

   const app = initializeApp(firebaseConfig);
   export const db = getFirestore(app);
