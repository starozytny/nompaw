import firebase from "firebase/compat/app";
import "firebase/compat/messaging";

import FirebaseConfig from "@userFunctions/firebase-config";

import toastr from "toastr"

// Initialize Firebase
firebase.initializeApp(FirebaseConfig.getConfig());
const messaging = firebase.messaging();

messaging.onMessage((payload) => {
    console.log('Message received. ', payload);

    toastr.info("notif")
});
