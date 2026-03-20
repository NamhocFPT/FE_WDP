// src/routers/index.js
import React from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "component/layout/DashboardLayout";
import { store } from "service/store";

// Auth
import Login from "component/pages/auth/Login";
import ForgotPassword from "component/pages/auth/ForgotPassword";
import ResetPassword from "component/pages/auth/ResetPassword";

// Common
import ChangePassword from "component/pages/common/ChangePassword";
import Profile from "component/pages/common/Profile";
import NotFound from "component/pages/common/NotFound";
import Forbidden from "component/pages/common/Forbidden";
import Notifications from "component/pages/common/Notifications";

// Admin
import AdminDashboard from "component/pages/admin/AdminDashboard";
import UserManagement from "component/pages/admin/UserManagement";
import CourseManagement from "component/pages/admin/CourseManagement";
import ClassManagement from "component/pages/admin/ClassManagement";
import ClassDetail from "component/pages/admin/ClassDetail";
import ScheduleManagement from "component/pages/admin/ScheduleManagement";
import Reports from "component/pages/admin/Reports";

// Teacher
import TeacherDashboard from "component/pages/teacher/TeacherDashboard";
import TeacherSchedule from "component/pages/teacher/TeacherSchedule";
import QuizCreation from "component/pages/teacher/QuizCreation";
import MaterialsManagement from "component/pages/teacher/MaterialsManagement";
import AssignmentManagement from "component/pages/teacher/AssignmentManagement";
import GradingPage from "component/pages/teacher/GradingPage";
import QuizQuestionManager from "component/pages/teacher/QuizQuestionManager";
import TeacherClassList from "../pages/teacher/TeacherClassList";
import SubmissionList from "../pages/teacher/SubmissionList";
import TeacherGradingWorkspace from '../pages/teacher/TeacherGradingWorkspace';
import QuizAttempts from "component/pages/teacher/QuizAttempts";
import QuizReviewAttempt from "component/pages/teacher/QuizReviewAttempt";
import TeacherGradebook from "component/pages/teacher/TeacherGradebook";
import QuizList from "component/pages/teacher/QuizList";

// Student
import StudentDashboard from "component/pages/student/StudentDashboard";
import MyClasses from "component/pages/student/MyClasses";
import ClassHome from "component/pages/student/ClassHome";
import Grades from "component/pages/student/Grades";
import StudentClassGrades from "component/pages/student/StudentClassGrades";
import StudentAssignmentDetail from "../pages/student/StudentAssignmentDetail";
import StudentQuizStart from "component/pages/student/StudentQuizStart";
import StudentQuizTake from "component/pages/student/StudentQuizTake";
import StudentQuizSummary from "component/pages/student/StudentQuizSummary";

function ProtectedRoute({ children }) {
  const currentUser = store.getCurrentUser();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function RootRedirect() {
  const currentUser = store.getCurrentUser();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Navigate to={`/${currentUser.role}`} replace />;
}

// ✅ export MẢNG routes để dùng với useRoutes()
export const router = [
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/", element: <RootRedirect /> },
  { path: "/forbidden", element: <Forbidden /> },

  {
    path: "/change-password",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <ChangePassword /> }],
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <Profile /> }],
  },
  {
    path: "/notifications",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <Notifications /> }],
  },

  // Admin
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <DashboardLayout requiredRole="admin" />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <UserManagement /> },
      { path: "courses", element: <CourseManagement /> },
      { path: "classes", element: <ClassManagement /> },
      { path: "classes/:id", element: <ClassDetail /> },
      { path: "schedule", element: <ScheduleManagement /> },
      { path: "reports", element: <Reports /> },
    ],
  },

  // Teacher
  {
    path: "/teacher",
    element: (
      <ProtectedRoute>
        <DashboardLayout requiredRole="teacher" />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <TeacherDashboard /> },
      { path: "schedule", element: <TeacherSchedule /> },
      { path: "materials", element: <MaterialsManagement /> },
      { path: "classes/:classId/materials", element: <MaterialsManagement /> },
      { path: "classes", element: <TeacherClassList /> },
      { path: "quizzes", element: <QuizList /> },
      { path: "quizzes/create", element: <QuizCreation /> },
      { path: "classes/:classId/assignments", element: <AssignmentManagement /> },
      { path: "grading", element: <GradingPage /> },
      { path: "notifications", element: <TeacherDashboard /> },
      { path: "assessments/:assessmentId/submissions", element: <SubmissionList /> },
      { path: "grading/:submissionId", element: <TeacherGradingWorkspace /> },
      { path: "classes/:classId/quizzes/:quizId/questions", element: <QuizQuestionManager /> },
      { path: "assessments/:assessmentId/quiz-attempts", element: <QuizAttempts /> },
      { path: "quiz-attempts/:submissionId/review", element: <QuizReviewAttempt /> },
      { path: "classes/:classId/quizzes", element: <QuizList /> },
      { path: "classes/:classId/gradebook", element: <TeacherGradebook /> },
    ],
  },

  // Student
  {
    path: "/student",
    element: (
      <ProtectedRoute>
        <DashboardLayout requiredRole="student" />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: "classes", element: <MyClasses /> },
      { path: "classes/:id", element: <ClassHome /> },
      { path: "schedule", element: <StudentDashboard /> },
      { path: "materials", element: <StudentDashboard /> },
      { path: "quizzes", element: <StudentDashboard /> },
      { path: "quizzes/:quizId/start", element: <StudentQuizStart /> },
      { path: "attempts/:submissionId/take", element: <StudentQuizTake /> },
      { path: "attempts/:submissionId/summary", element: <StudentQuizSummary /> },
      { path: "grades", element: <Grades /> },
      { path: "classes/:classId/grades", element: <StudentClassGrades /> },
      { path: "assessments/:assessmentId", element: <StudentAssignmentDetail /> },
    ],
  },

  { path: "*", element: <NotFound /> },
];