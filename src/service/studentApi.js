import axios from 'axios';

const api = axios.create({ 
    baseURL: 'http://localhost:9999/api/student' 
});

// Thêm Interceptor: Tự động nhét Token vào mọi chuyến xe Axios gửi đi
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("smartedu_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const getStudentDashboard = () => {
    return api.get("/dashboard");
};

const getMyClasses = () => {
    return api.get("/classes");
};

const getClassDetails = (classId) => {
    return api.get(`/classes/${classId}`);
};

export const studentApi = {
    getStudentDashboard,
    getMyClasses,
    getClassDetails,
};