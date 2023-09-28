importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const config = {
    apiKey: "AIzaSyDs3QB9aPYSnvxnE4xSoqzq9WleXUIy5pI",
    authDomain: "nompaw.firebaseapp.com",
    projectId: "nompaw",
    storageBucket: "nompaw.appspot.com",
    messagingSenderId: "228209465188",
    appId: "1:228209465188:web:727283efe7aa7845200c71"
};

firebase.initializeApp(config);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
    );
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = payload.notification;
    self.registration.showNotification(notificationTitle, notificationOptions);
});
