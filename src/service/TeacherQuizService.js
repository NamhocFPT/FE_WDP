import * as request from '../utils/request'

// ===============================
// GET TEACHER CLASSES
// ===============================
export const getTeacherClasses = async () => {
    try {
        // Giả sử API lấy class của teacher là /api/teacher/classes
        const res = await request.get("api/teacher/classes");
        return res;
    } catch (error) {
        console.error("Error getTeacherClasses:", error);
        throw error;
    }
};

// ===============================
// GET QUIZ LIST BY CLASS
// ===============================
export const getQuizByClass = async (classId) => {
    try {
        const res = await request.get(`api/teacher/classes/${classId}/quizzes`);
        return res;
    } catch (error) {
        console.error("Error getQuizByClass:", error);
        throw error;
    }
};

// ===============================
// GET QUIZ DETAIL
// ===============================
export const getQuizDetail = async (quizId) => {
    try {
        // Giả sử API lấy detail có thể nằm ở /api/teacher/quizzes/:quizId
        const res = await request.get(`api/teacher/quizzes/${quizId}`);
        return res;
    } catch (error) {
        console.error("Error getQuizDetail:", error);
        throw error;
    }
};

// ===============================
// CREATE QUIZ
// ===============================
export const createQuiz = async ({ classId, payload }) => {
    try {
        const res = await request.post(`api/teacher/classes/${classId}/quizzes`, payload);
        return res;
    } catch (error) {
        console.error("Error createQuiz:", error);
        throw error; // Ném lỗi để component catch (E3, E1, E2)
    }
};

// ===============================
// UPDATE QUIZ
// ===============================
export const updateQuiz = async (quizId, data) => {
    try {
        const res = await request.patch("quizzes", data, quizId);
        return res;
    } catch (error) {
        console.error("Error updateQuiz:", error);
    }
};

// ===============================
// DELETE QUIZ
// ===============================
export const deleteQuiz = async (quizId) => {
    try {
        const res = await request.dele("quizzes", quizId);
        return res;
    } catch (error) {
        console.error("Error deleteQuiz:", error);
    }
};