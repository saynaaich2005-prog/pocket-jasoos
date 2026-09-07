/**
 * Pocket Jasoos Authentication System
 * Unified Client-Side & Backend Compatible Auth Service
 * Features Safe Storage Fallback & Demo Investigator Auto-Seeding
 */

const PocketJasoosAuth = (() => {
    const STORAGE_KEY_USER = 'pocket_jasoos_user';
    const STORAGE_KEY_USERS_DB = 'pocket_jasoos_all_users';

    // In-memory fallback for restricted environments (file://, sandboxed iframes, cookies disabled)
    const memoryStore = {};

    const safeStorage = {
        getItem: (key) => {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    return window.localStorage.getItem(key);
                }
            } catch (e) {
                // Ignore and fall back to memory
            }
            return memoryStore[key] || null;
        },
        setItem: (key, val) => {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(key, val);
                    return;
                }
            } catch (e) {
                // Ignore and fall back to memory
            }
            memoryStore[key] = String(val);
        },
        removeItem: (key) => {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem(key);
                }
            } catch (e) {
                // Ignore and fall back to memory
            }
            delete memoryStore[key];
        }
    };

    // Default Demo Agent
    const DEFAULT_AGENT = {
        uid: 'agent-007',
        name: 'Agent Jasoos',
        email: 'agent@pocketjasoos.com',
        password: 'detective123',
        badgeId: 'PJ-7892',
        role: 'Lead Financial Investigator',
        createdAt: new Date().toISOString()
    };

    // Seed initial demo agent into DB
    const initStorage = () => {
        let users = [];
        try {
            const raw = safeStorage.getItem(STORAGE_KEY_USERS_DB);
            users = raw ? JSON.parse(raw) : [];
        } catch (e) {
            users = [];
        }

        if (!Array.isArray(users) || users.length === 0) {
            users = [DEFAULT_AGENT];
            safeStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
        } else {
            // Ensure demo agent exists in users list
            const hasDemo = users.some(u => u.email.toLowerCase() === DEFAULT_AGENT.email.toLowerCase());
            if (!hasDemo) {
                users.push(DEFAULT_AGENT);
                safeStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
            }
        }
    };

    initStorage();

    /**
     * Get currently logged-in user
     */
    const getCurrentUser = () => {
        try {
            const userJson = safeStorage.getItem(STORAGE_KEY_USER);
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            return null;
        }
    };

    /**
     * Ensures an active user exists (auto-assigns default demo agent if none is active)
     */
    const ensureUser = () => {
        let user = getCurrentUser();
        if (!user) {
            user = {
                uid: DEFAULT_AGENT.uid,
                name: DEFAULT_AGENT.name,
                email: DEFAULT_AGENT.email,
                badgeId: DEFAULT_AGENT.badgeId,
                role: DEFAULT_AGENT.role,
                loggedInAt: new Date().toISOString()
            };
            safeStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        }
        return user;
    };

    /**
     * Continue as a guest detective
     */
    const continueAsGuest = (guestName = 'Agent Jasoos') => {
        const guestUser = {
            uid: 'guest-' + Date.now(),
            name: guestName,
            email: 'guest@pocketjasoos.local',
            badgeId: 'PJ-' + Math.floor(1000 + Math.random() * 9000),
            role: 'Guest Investigator',
            isGuest: true,
            loggedInAt: new Date().toISOString()
        };
        safeStorage.setItem(STORAGE_KEY_USER, JSON.stringify(guestUser));
        updateUI();
        return guestUser;
    };

    /**
     * Validate email format
     */
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email || '').toLowerCase());
    };

    /**
     * Login user
     */
    const login = async (email, password) => {
        const cleanEmail = (email || '').trim().toLowerCase();

        if (!cleanEmail || !validateEmail(cleanEmail)) {
            return { success: false, message: 'Please enter a valid investigator email address.' };
        }
        if (!password) {
            return { success: false, message: 'Password is required to decrypt vault.' };
        }

        try {
            const users = JSON.parse(safeStorage.getItem(STORAGE_KEY_USERS_DB) || '[]');
            const user = users.find(u => (u.email || '').toLowerCase() === cleanEmail);

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
                role: user.role || 'Field Agent',
                loggedInAt: new Date().toISOString()
            };

            safeStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionUser));
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
        const cleanName = (name || '').trim();
        const cleanEmail = (email || '').trim().toLowerCase();

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
            const users = JSON.parse(safeStorage.getItem(STORAGE_KEY_USERS_DB) || '[]');
            const existing = users.find(u => (u.email || '').toLowerCase() === cleanEmail);

            if (existing) {
                return { success: false, message: 'Agent with this email is already registered. Please login.' };
            }

            const newUser = {
                uid: 'agent-' + Date.now(),
                name: cleanName,
                email: cleanEmail,
                password: password,
                badgeId: 'PJ-' + Math.floor(1000 + Math.random() * 9000),
                role: 'Field Agent',
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            safeStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

            // Auto-login newly registered user
            const sessionUser = {
                uid: newUser.uid,
                name: newUser.name,
                email: newUser.email,
                badgeId: newUser.badgeId,
                role: newUser.role,
                loggedInAt: new Date().toISOString()
            };

            safeStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionUser));
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
        safeStorage.removeItem(STORAGE_KEY_USER);
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
        if (typeof document === 'undefined') return;
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

        // 4. Badge display
        const badgeElements = document.querySelectorAll('.user-display-badge');
        badgeElements.forEach(el => {
            if (user && user.badgeId) {
                el.textContent = user.badgeId;
            }
        });

        // 5. Radiant intro welcome message
        const introWelcome = document.getElementById('intro-welcome');
        if (introWelcome) {
            introWelcome.textContent = user ? `Welcome ${user.name}` : 'Welcome Detective';
        }

        // 6. Toggle visibility of Auth vs Guest controls
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

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateUI);
        } else {
            updateUI();
        }
    }

    return {
        getCurrentUser,
        ensureUser,
        continueAsGuest,
        validateEmail,
        login,
        signup,
        logout,
        requireAuth,
        updateUI
    };
})();

// Export globally
if (typeof window !== 'undefined') {
    window.PocketJasoosAuth = PocketJasoosAuth;
}
