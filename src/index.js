import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';

const firebaseApp = initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    // storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    // messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    // measurementId: process.env.FIREBASE_MEASUREMENT_ID
});

const auth = getAuth(firebaseApp);

// Detect auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in');
    } else {
        console.log('No user is signed in');
    }
});

// Register a new user with email and password
const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password
        );
        const user = userCredential.user;
        console.log('User registered successfully', user);
    }
    catch (error) {
        console.error('Error registering user', error);
    }
}

// Login a user with email and password
const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User logged in successfully', user);
    }
    catch (error) {
        console.error('Error logging in user', error);
    }
}
