import axios from 'axios';
import { store } from './store';

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

export const studentApi = {
    getStudentDashboard,
    getMyClasses,
    getClassDetails,
};
