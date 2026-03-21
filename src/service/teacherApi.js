import axios from 'axios';
import { store } from './store';

const api = axios.create({ baseURL: 'http://localhost:9999/api/teacher' });

api.interceptors.request.use((config) => {
    const token = store.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const getMyClasses = () => {
    return api.get("/my-classes");
};

export const teacherApi = {
    getMyClasses,
};
