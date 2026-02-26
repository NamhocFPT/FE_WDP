import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/admin' });

export const adminApi = {
    // --- UC_ADM_10: COURSES ---
    getCourses: () => api.get('/courses'),
    addCourse: (data) => api.post('/courses', data),
    // Bổ sung để khớp nút Edit/Delete trong Figma
    updateCourse: (id, data) => api.put(`/courses/${id}`, data),
    deleteCourse: (id) => api.delete(`/courses/${id}`),
    
    // --- UC_ADM_11: CLASSES ---
    getClasses: () => api.get('/classes'),
    addClass: (data) => api.post('/classes', data),
    // Bổ sung update để khớp Modal Edit Class (image_6cf546)
    updateClass: (id, data) => api.put(`/classes/${id}`, data),
    getClassDetail: (id) => api.get(`/classes/${id}`),

    // --- CÁC CHỨC NĂNG BÊN TRONG TAB (image_6cf5a1, image_6cf59b, image_6cf57c) ---
    assignTeacher: (classId, teacherId) => api.post(`/classes/${classId}/assign-teacher`, { teacherId }),
    enrollStudent: (classId, studentData) => api.post(`/classes/${classId}/enroll`, studentData),
    addSession: (classId, sessionData) => api.post(`/classes/${classId}/sessions`, sessionData),
};