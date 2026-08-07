/**
 * Pocket Jasoos Authentication System
 * Unified Client-Side & Backend Compatible Auth Service
 */

const PocketJasoosAuth = (() => {
    const STORAGE_KEY_USER = 'pocket_jasoos_user';
    const STORAGE_KEY_USERS_DB = 'pocket_jasoos_all_users';

    // Seed initial demo agent if none exists
    const initStorage = () => {
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS_DB)) || [];
        } catch (e) {
            users = [];
        }

        if (!users || users.length === 0) {
            const defaultAgent = {
                uid: 'agent-007',
                name: 'Agent Jasoos',
                email: 'agent@pocketjasoos.com',
                password: 'detective123',
                createdAt: new Date().toISOString(),
                badgeId: 'PJ-7892'
            };
            users.push(defaultAgent);
            localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
        }
    };

    initStorage();

    /**
     * Get currently logged-in user
     */
    const getCurrentUser = () => {
        try {
            const userJson = localStorage.getItem(STORAGE_KEY_USER);
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            return null;
        }
    };

    /**
     * Validate email format
     */
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    /**
     * Login user
     */
    const login = async (email, password) => {
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail || !validateEmail(cleanEmail)) {
            return { success: false, message: 'Please enter a valid investigator email address.' };
        }
        if (!password) {
            return { success: false, message: 'Password is required to decrypt vault.' };
        }

        try {
            const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS_DB)) || [];
            const user = users.find(u => u.email.toLowerCase() === cleanEmail);

            if (!user) {
                return { success: false, message: 'Agent credentials not found. Please register first.' };
            }

            if (user.password !== password) {
                return { success: false, message: 'Incorrect passcode. Access denied to case files.' };
            }

            // Create active session
            const sessionUser = {
                uid: user.uid || 'agent-' + Date.now(),
                name: user.name || 'Agent Jasoos',
                email: user.email,
                badgeId: user.badgeId || 'PJ-' + Math.floor(1000 + Math.random() * 9000),
                loggedInAt: new Date().toISOString()
            };

            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionUser));
            updateUI();
            return { success: true, user: sessionUser };

        } catch (e) {
            return { success: false, message: 'Authentication error occurred. Please try again.' };
        }
    };

    /**
     * Signup / Register new user
     */
    const signup = async (name, email, password) => {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName) {
            return { success: false, message: 'Agent name is required.' };
        }
        if (!cleanEmail || !validateEmail(cleanEmail)) {
            return { success: false, message: 'Please enter a valid investigator email address.' };
        }
        if (!password || password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters long.' };
        }

        try {
            const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS_DB)) || [];
            const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

            if (existing) {
                return { success: false, message: 'Agent with this email is already registered. Please login.' };
            }

            const newUser = {
                uid: 'agent-' + Date.now(),
                name: cleanName,
                email: cleanEmail,
                password: password,
                badgeId: 'PJ-' + Math.floor(1000 + Math.random() * 9000),
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

            // Auto-login newly registered user
            const sessionUser = {
                uid: newUser.uid,
                name: newUser.name,
                email: newUser.email,
                badgeId: newUser.badgeId,
                loggedInAt: new Date().toISOString()
            };

            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionUser));
            updateUI();
            return { success: true, user: sessionUser };

        } catch (e) {
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    };

    /**
     * Logout currently logged-in user
     */
    const logout = () => {
        localStorage.removeItem(STORAGE_KEY_USER);
        updateUI();
        window.location.href = 'login.html';
    };

    /**
     * Protect page route - redirects unauthenticated users to login.html
     */
    const requireAuth = () => {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }
        updateUI();
        return true;
    };

    /**
     * Dynamically update UI across the application
     */
    const updateUI = () => {
        const user = getCurrentUser();

        // 1. Header user welcome text
        const welcomeElements = document.querySelectorAll('.user-welcome-text, #header-welcome-text');
        welcomeElements.forEach(el => {
            if (user) {
                el.textContent = `Welcome ${user.name}`;
            } else {
                el.textContent = 'Welcome Guest Agent';
            }
        });

        // 2. User name display
        const nameElements = document.querySelectorAll('.user-display-name');
        nameElements.forEach(el => {
            if (user) {
                el.textContent = user.name;
            }
        });

        // 3. User email display
        const emailElements = document.querySelectorAll('.user-display-email');
        emailElements.forEach(el => {
            if (user) {
                el.textContent = user.email;
            }
        });

        // 4. Radiant intro welcome message
        const introWelcome = document.getElementById('intro-welcome');
        if (introWelcome) {
            introWelcome.textContent = user ? `Welcome ${user.name}` : 'Welcome User';
        }

        // 5. Toggle visibility of Auth vs Guest controls
        const authOnlyElements = document.querySelectorAll('.auth-only');
        const guestOnlyElements = document.querySelectorAll('.guest-only');

        authOnlyElements.forEach(el => {
            if (user) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        guestOnlyElements.forEach(el => {
            if (user) {
                el.classList.add('hidden');
            } else {
                el.classList.remove('hidden');
            }
        });
    };

    document.addEventListener('DOMContentLoaded', updateUI);

    return {
        getCurrentUser,
        validateEmail,
        login,
        signup,
        logout,
        requireAuth,
        updateUI
    };
})();

// Export globally
window.PocketJasoosAuth = PocketJasoosAuth;
