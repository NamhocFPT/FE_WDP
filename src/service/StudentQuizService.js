import * as request from '../utils/request'

// ===============================
// START/RESUME ATTEMPT
// ===============================
export const startAttempt = async (quizId) => {
    try {
        const res = await request.post(`api/student/quizzes/${quizId}/attempts/start`);
        return res;
    } catch (error) {
        console.error("Error startAttempt:", error);
        throw error;
    }
};

// ===============================
// GET ATTEMPT STATE (Questions)
// ===============================
export const getAttemptState = async (submissionId) => {
    try {
        const res = await request.get(`api/student/attempts/${submissionId}`);
        return res;
    } catch (error) {
        console.error("Error getAttemptState:", error);
        throw error;
    }
};

// ===============================
// SAVE ANSWER (Auto-save)
// ===============================
export const saveAnswer = async (submissionId, questionId, payload) => {
    try {
        const res = await request.patch(`api/student/attempts/${submissionId}/questions/${questionId}/answer`, payload);
        return res;
    } catch (error) {
        console.error("Error saveAnswer:", error);
        throw error;
    }
};

// ===============================
// GET SUMMARY OF ATTEMPT
// ===============================
export const getAttemptSummary = async (submissionId) => {
    try {
        const res = await request.get(`api/student/attempts/${submissionId}/summary`);
        return res;
    } catch (error) {
        console.error("Error getAttemptSummary:", error);
        throw error;
    }
};

// ===============================
// SUBMIT ALL & FINISH
// ===============================
export const submitAttempt = async (submissionId) => {
    try {
        const res = await request.post(`api/student/attempts/${submissionId}/submit`);
        return res;
    } catch (error) {
        console.error("Error submitAttempt:", error);
        throw error;
    }
};
