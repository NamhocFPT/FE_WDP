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

// ===============================
// UC_TEA_13: GET QUIZ ATTEMPTS + SCORE DISTRIBUTION
// ===============================
export const getQuizAttempts = async (assessmentId) => {
    try {
        const res = await request.get(`api/teacher/quizzes/${assessmentId}/attempts`);
        return res;
    } catch (error) {
        console.error("Error getQuizAttempts:", error);
        throw error;
    }
};

// ===============================
// UC_TEA_13: GET SUBMISSION REVIEW
// ===============================
export const getSubmissionReview = async (submissionId) => {
    try {
        const res = await request.get(`api/teacher/quizzes/attempts/${submissionId}/review`);
        return res;
    } catch (error) {
        console.error("Error getSubmissionReview:", error);
        throw error;
    }
};

// ===============================
// UC_TEA_13: OVERRIDE QUESTION MARK
// ===============================
export const overrideQuestionMark = async (submissionId, questionId, payload) => {
    try {
        const res = await request.put(`api/teacher/quizzes/attempts/${submissionId}/questions/${questionId}/override`, payload);
        return res;
    } catch (error) {
        console.error("Error overrideQuestionMark:", error);
        throw error;
    }
};

// ===============================
// UC_TEA_13: DELETE SUBMISSION
// ===============================
export const deleteSubmission = async (submissionId) => {
    try {
        const res = await request.dele(`api/teacher/quizzes/attempts/${submissionId}`);
        return res;
    } catch (error) {
        console.error("Error deleteSubmission:", error);
        throw error;
    }
};

// ===============================
// UC_TEA_13: REGRADE ALL
// ===============================
export const regradeAll = async (assessmentId) => {
    try {
        const res = await request.post(`api/teacher/quizzes/${assessmentId}/regrade`);
        return res;
    } catch (error) {
        console.error("Error regradeAll:", error);
        throw error;
    }
};

// ===============================
// UC_TEA_15: PUBLISH GRADES
// ===============================
export const publishGrades = async (classId, assessmentId, payload) => {
    try {
        const res = await request.put(`api/teacher/classes/${classId}/assessments/${assessmentId}/grades/publish`, payload);
        return res;
    } catch (error) {
        console.error("Error publishGrades:", error);
        throw error;
    }
};

// ===============================
// UC_TEA_09: QUIZ QUESTION MANAGEMENT
// ===============================

export const getQuizQuestions = async (quizId) => {
    if (!quizId || quizId === "undefined") {
        console.error("Invalid quizId provided to getQuizQuestions");
        return { success: false, message: "ID bài thi không hợp lệ" };
    }
    try {
        const res = await request.get(`api/teacher/quizzes/${quizId}/questions`);
        return res;
    } catch (error) {
        console.error("Error getQuizQuestions:", error);
        throw error;
    }
};

export const createQuestion = async (quizId, payload) => {
    if (!quizId || quizId === "undefined") {
        console.error("Invalid quizId provided to createQuestion");
        return { success: false, message: "ID bài thi không hợp lệ" };
    }
    try {
        const res = await request.post(`api/teacher/quizzes/${quizId}/questions`, payload);
        return res;
    } catch (error) {
        console.error("Error createQuestion:", error);
        throw error;
    }
};


export const updateQuestion = async (questionId, payload) => {
    try {
        const res = await request.put(`api/teacher/quizzes/questions/${questionId}`, payload);
        return res;
    } catch (error) {
        console.error("Error updateQuestion:", error);
        throw error;
    }
};

export const deleteQuestion = async (questionId) => {
    try {
        const res = await request.dele(`api/teacher/quizzes/questions`, questionId);
        return res;
    } catch (error) {
        console.error("Error deleteQuestion:", error);
        throw error;
    }
};

export const generateAIQuestions = async (quizId, payload) => {
    if (!quizId || quizId === "undefined") {
        console.error("Invalid quizId provided to generateAIQuestions");
        return { success: false, message: "ID bài thi không hợp lệ" };
    }
    try {
        const res = await request.post(`api/teacher/quizzes/${quizId}/generate-ai`, payload);
        return res;
    } catch (error) {
        console.error("Error generateAIQuestions:", error);
        throw error;
    }
};

export const bulkSaveQuestions = async (quizId, questions) => {
    if (!quizId || quizId === "undefined") {
        console.error("Invalid quizId provided to bulkSaveQuestions");
        return { success: false, message: "ID bài thi không hợp lệ" };
    }
    try {
        const res = await request.post(`api/teacher/quizzes/${quizId}/questions/bulk`, { questions });
        return res;
    } catch (error) {
        console.error("Error bulkSaveQuestions:", error);
        throw error;
    }
};


