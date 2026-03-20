import axios from 'axios';
import { store } from './store';

// const api = axios.create({
//     baseURL: 'http://localhost:9999/api/student'
// });

// // Thêm Interceptor: Tự động nhét Token vào mọi chuyến xe Axios gửi đi
// api.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem("smartedu_token");
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );
const api = axios.create({ baseURL: 'http://localhost:9999/api/student' });

api.interceptors.request.use((config) => {
    const token = store.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const getStudentId = () => store.getCurrentUser()?.id;

const getStudentDashboard = () => {
    return api.get("/dashboard", { params: { studentId: getStudentId() } });
};

const getMyClasses = () => {
    return api.get("/classes", { params: { studentId: getStudentId() } });
};

const getClassDetails = (classId) => {
    return api.get(`/classes/${classId}`, { params: { studentId: getStudentId() } });
};

// UC_STU_11: Xem bảng điểm chi tiết của một lớp
const getClassGrades = (classId) => {
    return api.get(`/classes/${classId}/grades`);
};

// UC_STU_11: Tổng quan điểm tất cả các môn
const getGradesOverview = () => {
    return api.get(`/grades/overview`);
};

export const studentApi = {
    getStudentDashboard,
    getMyClasses,
    getClassDetails,
    getClassGrades,
    getGradesOverview,
};