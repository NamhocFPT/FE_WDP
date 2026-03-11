// src/service/api.js
import { store } from "./store";

const BASE_URL = "http://localhost:9999/api";

async function fetchWithAuth(url, options = {}) {
    const token = store.getToken();
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
}

export const api = {
    async login(email, password) {
        return fetchWithAuth("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
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
    }
};
