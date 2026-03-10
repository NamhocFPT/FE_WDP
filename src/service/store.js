// src/service/store.js
import { api } from "./api";

const TOKEN_KEY = "smartedu_token";
const USER_KEY = "smartedu_user";

function readData() {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const user = localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)) : null;
        return { token, user };
    } catch {
        return { token: null, user: null };
    }
}

let { token: currentToken, user: currentUser } = readData();

export const store = {
    getToken() {
        return currentToken;
    },

    getCurrentUser() {
        return currentUser;
    },

    setAuth(token, user) {
        currentToken = token;
        currentUser = user;

        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);

        if (user) {
            // Map role ID to short role code for frontend routing compat
            // Let's assume user.role is a string like "ADMIN", "STUDENT", we lowercase it.
            const uiUser = { ...user, role: user.role?.toLowerCase() || "student", fullName: user.full_name || user.email };
            currentUser = uiUser;
            localStorage.setItem(USER_KEY, JSON.stringify(uiUser));
        } else {
            localStorage.removeItem(USER_KEY);
        }
    },

    async logout() {
        await api.logout().catch(() => { });
        this.setAuth(null, null);
    }
};