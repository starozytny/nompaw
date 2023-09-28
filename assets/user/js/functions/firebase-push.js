import firebase from "firebase/compat/app";
import "firebase/compat/messaging";

import FirebaseConfig from "@userFunctions/firebase-config";

import toastr from "toastr"

// Initialize Firebase
firebase.initializeApp(FirebaseConfig.getConfig());
const messaging = firebase.messaging();

messaging.onMessage((payload) => {
    toastr.info(payload.notification.body, payload.notification.title);
});
