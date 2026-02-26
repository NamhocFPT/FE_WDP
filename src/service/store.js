// src/service/store.js
const KEY = "smartedu_current_user";

const mockUsers = [
    { id: "u1", email: "admin@smartedu.com", fullName: "Admin User", role: "admin" },
    { id: "u2", email: "teacher@smartedu.com", fullName: "Dr. Sarah Johnson", role: "teacher" },
    { id: "u3", email: "student@smartedu.com", fullName: "John Smith", role: "student" },
];

function readUser() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeUser(user) {
    if (!user) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(user));
}

let currentUser = readUser();

export const store = {
    getCurrentUser() {
        return currentUser;
    },

    login(email, password) {
        // demo: chỉ cần đúng email + có password là ok
        const user = mockUsers.find((u) => u.email === email);
        if (!user || !password) return null;

        currentUser = user;
        writeUser(user);
        return user;
    },

    updateProfile(partial) {
        if (!currentUser) return null;
        currentUser = { ...currentUser, ...partial };
        writeUser(currentUser);
        return currentUser;
    },

    logout() {
        currentUser = null;
        writeUser(null);
    },

    getMockUsers() {
        return mockUsers;
    },
};