import firebase from 'firebase';

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyBbyRCtniGGdWoOoMHUAAu9zezI7iyKu5c",
    authDomain: "villager-s-library.firebaseapp.com",
    databaseURL: "https://villager-s-library.firebaseio.com",
    projectId: "villager-s-library",
    storageBucket: "villager-s-library.appspot.com",
    messagingSenderId: "1069133056834",
    appId: "1:1069133056834:web:c54ef9048403c622f1d6db"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);


  export default firebase.firestore();