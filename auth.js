document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized before accessing auth
    if (typeof firebase === 'undefined') {
        console.error("Firebase not initialized. Make sure app.js is loaded first.");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    const authForm = document.getElementById('authForm');
    const nameField = document.getElementById('nameField');
    const submitBtn = document.getElementById('submitBtn');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const toggleText = document.getElementById('toggleText');
    const errorMessage = document.getElementById('errorMessage');

    let isLoginMode = true;

    // --- Toggle between Login and Sign Up UI ---
    toggleAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        errorMessage.textContent = ''; // Clear any previous errors

        if (isLoginMode) {
            formTitle.textContent = 'Welcome Back';
            formSubtitle.textContent = 'Please sign in to continue.';
            nameField.classList.add('hidden');
            submitBtn.textContent = 'Sign In';
            toggleText.textContent = "Don't have an account?";
            toggleAuthMode.textContent = 'Sign Up';
        } else {
            formTitle.textContent = 'Create an Account';
            formSubtitle.textContent = 'Get started with PICO IoT.';
            nameField.classList.remove('hidden');
            submitBtn.textContent = 'Sign Up';
            toggleText.textContent = 'Already have an account?';
            toggleAuthMode.textContent = 'Sign In';
        }
    });

    // --- Handle Form Submission ---
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = ''; // Clear errors on new submission

        const email = authForm.email.value;
        const password = authForm.password.value;
        const name = authForm.name.value;

        if (isLoginMode) {
            // --- Sign In Logic ---
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log('User signed in:', userCredential.user);
                    window.location.href = '/PICO-IOT-Webpage/dashboard.html'; // Redirect to dashboard
                })
                .catch((error) => {
                    console.error('Sign in error:', error);
                    errorMessage.textContent = error.message;
                });
        } else {
            // --- Sign Up Logic ---
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log('User signed up:', user);
                    
                    // Create a user document in Firestore
                    return db.collection('users').doc(user.uid).set({
                        name: name,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    console.log('User document created in Firestore.');
                    window.location.href = '/PICO-IOT-Webpage/dashboard.html'; // Redirect to dashboard
                })
                .catch((error) => {
                    console.error('Sign up error:', error);
                    errorMessage.textContent = error.message;
                });
        }
    });
});
