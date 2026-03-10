import axios from 'axios';
import { store } from './store';

const api = axios.create({ baseURL: 'http://localhost:3000/api/student' });

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
