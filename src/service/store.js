// src/service/store.js
const USER_KEY = "smartedu_current_user";
const TOKEN_KEY = "smartedu_token"; // Thêm key để lưu JWT Token

// Đọc thông tin user từ LocalStorage khi khởi chạy app
function readUser() {
    try {
        const token = localStorage.getItem(TOKEN_USER_KEY);
        const user = localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)) : null;
        return { token, user };
    } catch {
        return { token: null, user: null };
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

export const store = {
    getToken() {
        return currentToken;
    },

    getCurrentUser() {
        return currentUser;
    },

    // Hàm gọi API Login tới Backend cổng 9999
    async login(email, password) {
        try {
            const response = await fetch("http://localhost:9999/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            // Nếu HTTP status là 2xx và success = true
            if (response.ok && data.success) {
                const { user, token } = data.data;

                // --- THÊM DÒNG NÀY ĐỂ FIX LỖI ---
                if (user && user.role) {
                    user.role = user.role.toLowerCase();
                }

                currentUser = user;
                writeUser(user, token); // Lưu lại phiên đăng nhập
                return user;
            } else {
                // Quăng lỗi để bên UI (Login.js) bắt được và hiển thị
                throw new Error(data.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
            }
        } catch (error) {
            console.error("Login API Error:", error);
            // Nếu lỗi do mất kết nối mạng (Network Error)
            if (error.message === "Failed to fetch") {
                throw new Error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại Backend (Port 9999).");
            }
            throw error;
        }
    },

    updateProfile(partial) {
        if (!currentUser) return null;
        currentUser = { ...currentUser, ...partial };
        writeUser(currentUser);
        return currentUser;
    },

    logout() {
        currentUser = null;
        writeUser(null); // Xóa token và user khỏi LocalStorage
    }
};