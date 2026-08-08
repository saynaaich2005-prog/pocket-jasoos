/**
 * Pocket Jasoos Authentication System
 * Backend-driven auth using the Express + JWT API (see api.js for config).
 */

const PocketJasoosAuth = (() => {
    const STORAGE_KEY_USER = 'pocket_jasoos_user';
    const STORAGE_KEY_TOKEN = 'pocket_jasoos_token';

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
     * Get stored JWT token
     */
    const getToken = () => localStorage.getItem(STORAGE_KEY_TOKEN);

    /**
     * Validate email format
     */
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    /**
     * Persist user + token after successful login/registration
     */
    const setSession = (user, token) => {
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        updateUI();
    };

    /**
     * Clear stored session data
     */
    const clearSession = () => {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
        updateUI();
    };

    /**
     * Build auth headers for protected API requests
     */
    const getAuthHeaders = (token = getToken()) => {
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    /**
     * Login user against the backend API
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
            const res = await fetch(`${window.API.API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, message: data.message || 'Invalid email or password.' };
            }

            const sessionUser = {
                _id: data._id,
                name: data.name,
                email: data.email,
                badgeId: 'PJ-' + Math.floor(1000 + Math.random() * 9000),
                loggedInAt: new Date().toISOString(),
            };

            setSession(sessionUser, data.token);

            return { success: true, user: sessionUser };
        } catch (e) {
            return { success: false, message: 'Could not reach the server. Is the backend running?' };
        }
    };

    /**
     * Register a new user via the backend API
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
            const res = await fetch(`${window.API.API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, message: data.message || 'Registration failed. Please try again.' };
            }

            const sessionUser = {
                _id: data._id,
                name: data.name,
                email: data.email,
                badgeId: 'PJ-' + Math.floor(1000 + Math.random() * 9000),
                loggedInAt: new Date().toISOString(),
            };

            setSession(sessionUser, data.token);

            return { success: true, user: sessionUser };
        } catch (e) {
            return { success: false, message: 'Could not reach the server. Is the backend running?' };
        }
    };

    /**
     * Logout - clear stored session and redirect to login
     */
    const logout = () => {
        clearSession();
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
        getToken,
        setSession,
        clearSession,
        getAuthHeaders,
        validateEmail,
        login,
        signup,
        logout,
        requireAuth,
        updateUI,
    };
})();

// Export globally
window.PocketJasoosAuth = PocketJasoosAuth;
