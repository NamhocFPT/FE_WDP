import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/student' });

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
