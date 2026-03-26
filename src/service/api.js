// src/service/api.js
import { store } from "./store";
import { toast } from "sonner";

const BASE_URL = "http://localhost:9999/api";

async function fetchWithAuth(url, options = {}) {
    const { skipNotFoundToast, ...fetchOptions } = options;
    const token = store.getToken();
    const headers = {
        ...fetchOptions.headers,
    };

    if (!headers["Content-Type"] && !(fetchOptions.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (fetchOptions.body instanceof FormData) {
        delete headers["Content-Type"];
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${url}`, {
        ...fetchOptions,
        headers,
    });

    const data = await response.json();

    if (
        response.status === 404 &&
        (!fetchOptions.method || fetchOptions.method === "GET") &&
        !skipNotFoundToast
    ) {
        toast.error("Nội dung này không còn tồn tại hoặc đã bị gỡ bởi Giáo viên.");
    }

    return { ok: response.ok, status: response.status, data };
}

export const api = {
    async get(url, options = {}) {
        return fetchWithAuth(url, { ...options, method: "GET" });
    },
    async post(url, body, options = {}) {
        return fetchWithAuth(url, {
            ...options,
            method: "POST",
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    },
    async put(url, body, options = {}) {
        return fetchWithAuth(url, {
            ...options,
            method: "PUT",
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    },
    async patch(url, body, options = {}) {
        return fetchWithAuth(url, {
            ...options,
            method: "PATCH",
            body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
        });
    },
    async delete(url, options = {}) {
        return fetchWithAuth(url, { ...options, method: "DELETE" });
    },

    async login(email, password) {
        return fetchWithAuth("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
    },

    async googleLogin(token) {
        return fetchWithAuth("/auth/google", {
            method: "POST",
            body: JSON.stringify({ token }),
        });
    },

    async forgotPassword(email) {
        return fetchWithAuth("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    },

    async resetPassword({ email, otp, newPassword }) {
        return fetchWithAuth("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ email, otp, newPassword }),
        });
    },

    async logout() {
        return fetchWithAuth("/auth/logout", {
            method: "POST",
        });
    },

    async getProfile() {
        return fetchWithAuth("/users/profile", {
            method: "GET",
        });
    },

    async updateProfile(updates) {
        return fetchWithAuth("/users/profile", {
            method: "PUT",
            body: JSON.stringify(updates),
        });
    },

    async changePassword(oldPassword, newPassword) {
        return fetchWithAuth("/users/password", {
            method: "PUT",
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        });
    },

    notifications: {
        async getUnreadCount() {
            return fetchWithAuth("/notifications/unread-count", { method: "GET" });
        },
        async getNotifications(params = {}) {
            const query = new URLSearchParams(params).toString();
            return fetchWithAuth(`/notifications?${query}`, { method: "GET" });
        },
        async readNotification(id) {
            return fetchWithAuth(`/notifications/${id}/read`, { method: "PATCH" });
        },
        async readAllNotifications() {
            return fetchWithAuth("/notifications/read-all", { method: "PATCH" });
        }
    },
    ai: {
        async classChat(classId, message, history = []) {
            return fetchWithAuth(`/ai/class-chat/${classId}`, {
                method: "POST",
                body: JSON.stringify({ message, history })
            });
        }
    }
};
