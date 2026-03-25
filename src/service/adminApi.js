import axios from "axios";
import { store } from "./store";

const api = axios.create({ baseURL: "http://localhost:9999/api/admin" });

api.interceptors.request.use((config) => {
    const token = store.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const adminApi = {
    // --- UC_ADM_10: COURSES ---
    getCourses: () => api.get("/courses"),
    addCourse: (courseData) => api.post("/courses", courseData),
    updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
    deleteCourse: (id) => api.delete(`/courses/${id}`),
    validateCourseImport: (rows) => api.post("/courses/import/validate", { rows }),
    confirmCourseImport: (validRows) => api.post("/courses/import/confirm", { validRows }),
    getCoursePublicMaterials: (courseId) => api.get(`/courses/${courseId}/public-materials`),
    addCoursePublicMaterial: (courseId, formData) => api.post(`/courses/${courseId}/public-materials`, formData),
    updateCoursePublicMaterial: (materialId, payload) => api.put(`/public-materials/${materialId}`, payload),
    toggleCoursePublicMaterialVisibility: (materialId) => api.patch(`/public-materials/${materialId}/visibility`),
    deleteCoursePublicMaterial: (materialId) => api.delete(`/public-materials/${materialId}`),

    // --- UC_ADM_11: CLASSES ---
    getClasses: () => api.get("/classes"),
    getCreateClassMetadata: () => api.get("/classes/create"),
    addClass: (data) => api.post("/classes", data),
    updateClass: (id, data) => api.put(`/classes/${id}`, data),
    getClassDetail: (id) => api.get(`/classes/${id}?t=${Date.now()}`),
    validateClassImport: (rows) => api.post("/classes/import/validate", { rows }),
    confirmClassImport: (validRows) => api.post("/classes/import/confirm", { validRows }),

    // --- UC_ADM_12: TEACHERS ---
    getTeachers: () => api.get("/teachers"),
    assignTeacher: (classId, teacherId) => api.put(`/classes/${classId}/assign-teacher`, { teacher_id: teacherId }),

    // --- UC_ADM_13: STUDENTS ---
    getStudents: () => api.get("/students"),
    enrollStudents: (classId, studentIds) => api.post(`/classes/${classId}/enroll`, { studentIds }),
    importStudents: (classId, emails) => api.post(`/classes/${classId}/import-students`, { emails }),
    validateStudentImport: (classId, rows) => api.post(`/classes/${classId}/import-students/validate`, { rows }),
    confirmStudentImport: (classId, validRows) => api.post(`/classes/${classId}/import-students/confirm`, { validRows }),
    unenrollStudent: (classId, studentId) => api.delete(`/classes/${classId}/students/${studentId}`),

    addSession: (classId, sessionData) => api.post(`/classes/${classId}/sessions`, sessionData),
    editSessions: (classId, data) => api.put(`/classes/${classId}/sessions`, data),
    deleteSessions: (classId, sessionIds) => api.delete(`/classes/${classId}/sessions`, { data: { sessionIds } }),

    // --- DASHBOARD & REPORTS ---
    getDashboardStats: () => api.get("/dashboard/stats"),
    getReportData: (semester, course, dateRange) => api.get("/reports/data", { params: { semester, course, dateRange } }),
    getReportFilters: () => api.get("/reports/filters"),
    getTeacherActivity: (semester, course, dateRange) => api.get("/reports/teacher-activity", { params: { semester, course, dateRange } }),

    // --- UC_ADM_05 -> UC_ADM_09: USER MANAGEMENT ---
    getUsers: (params) => api.get("/users", { params }),
    createUser: (data) => api.post("/users", data),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    toggleUserStatus: (id) => api.patch(`/users/${id}/status`),
    resetUserPassword: (id) => api.patch(`/users/${id}/reset-password`),
    validateUserImport: (data) => api.post("/users/import/validate", data),
    confirmUserImport: (data) => api.post("/users/import/confirm", data),

    // --- UC_ADM_15: IMPORT LICH HOC ---
    validateScheduleImport: (rows) => api.post("/schedule/import/validate", { rows }),
    confirmScheduleImport: (validRows) => api.post("/schedule/import/confirm", { validRows }),
};
