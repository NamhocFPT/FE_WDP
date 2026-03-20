// src/service/store.js
const USER_KEY = "smartedu_current_user";
const TOKEN_KEY = "smartedu_token";

// Đọc thông tin user từ LocalStorage khi khởi chạy app
function readUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function readToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
        return null;
    }
}

// Ghi đè hoặc xóa thông tin user/token vào LocalStorage
function writeUser(user, token) {
    if (!user) {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
    } else {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        if (token) localStorage.setItem(TOKEN_KEY, token);
    }
}

let currentUser = readUser();
let currentToken = readToken();

export const store = {
    getToken() {
        return currentToken;
    },

    getCurrentUser() {
        return currentUser;
    },

    // Được gọi từ Login.js sau khi api.login() thành công
    setAuth(token, user) {
        // Chuyển role về lowercase để khớp với route (/admin, /teacher, /student)
        if (user && user.role) {
            user.role = user.role.toLowerCase();
        }
        currentUser = user;
        currentToken = token;
        writeUser(user, token);
    },

    updateProfile(partial) {
        if (!currentUser) return null;
        currentUser = { ...currentUser, ...partial };
        writeUser(currentUser, currentToken);
        return currentUser;
    },

    logout() {
        currentUser = null;
        currentToken = null;
        writeUser(null); // Xóa token và user khỏi LocalStorage
    }
};