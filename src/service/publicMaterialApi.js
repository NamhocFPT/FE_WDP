import { api } from "./api";

export const publicMaterialApi = {
    searchByCourseCode(courseCode) {
        const normalizedCode = String(courseCode || "").trim().toUpperCase();
        const query = new URLSearchParams({ course_code: normalizedCode }).toString();
        return api.get(`/public-materials/search?${query}`, { skipNotFoundToast: true });
    },
};
