// src/service/api.js
import { store } from "./store";

const BASE_URL = "http://localhost:9999/api";

async function fetchWithAuth(url, options = {}) {
    const token = store.getToken();
    const headers = {
        ...options.headers,
    };

    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (options.body instanceof FormData) {
        delete headers["Content-Type"];
    }

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
