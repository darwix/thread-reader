import { CONFIG } from './config.js';

const loginView = document.getElementById('login-view');
const loggedInView = document.getElementById('logged-in-view');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const errorMsg = document.getElementById('error-msg');
const userEmailSpan = document.getElementById('user-email');

async function checkSession() {
    const { session } = await chrome.storage.local.get('session');
    if (session) {
        showLoggedIn(session.user.email);
    } else {
        showLogin();
    }
}

function showLoggedIn(email) {
    loginView.classList.add('hidden');
    loggedInView.classList.remove('hidden');
    userEmailSpan.textContent = email;
}

function showLogin() {
    loginView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
}

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) return;

    loginBtn.disabled = true;
    errorMsg.classList.add('hidden');

    try {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error_description || data.message || 'Login failed');
        }

        await chrome.storage.local.set({ session: data });
        showLoggedIn(data.user.email);
    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');
    } finally {
        loginBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove('session');
    showLogin();
});

checkSession();
