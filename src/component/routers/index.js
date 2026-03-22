// src/routers/index.js
import React from "react";
import { Navigate, useParams } from "react-router-dom";
import DashboardLayout from "component/layout/DashboardLayout";
import { store } from "service/store";

// Auth
import Login from "component/pages/auth/Login";

// Common
import ForceChangePassword from "component/pages/auth/ForceChangePassword";
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
import EssayCreation from "component/pages/teacher/EssayCreation";
import GradingPage from "component/pages/teacher/GradingPage";
import QuizQuestionManager from "component/pages/teacher/QuizQuestionManager";
import TeacherClassList from "../pages/teacher/TeacherClassList";
import TeacherClassHome from "component/pages/teacher/TeacherClassHome";
import SubmissionList from "../pages/teacher/SubmissionList";
import TeacherGradingWorkspace from '../pages/teacher/TeacherGradingWorkspace';
import QuizAttempts from "component/pages/teacher/QuizAttempts";
import TeacherStudentList from "component/pages/teacher/TeacherStudentList";
import QuizReviewAttempt from "component/pages/teacher/QuizReviewAttempt";
import TeacherGradebook from "component/pages/teacher/TeacherGradebook";
import QuizList from "component/pages/teacher/QuizList";
import ClassStream from "component/pages/common/stream/ClassStream";
import StreamNotificationPanel from "component/pages/common/stream/StreamNotificationPanel";

// Student
import StudentDashboard from "component/pages/student/StudentDashboard";
import MyClasses from "component/pages/student/MyClasses";
import ClassHome from "component/pages/student/ClassHome";
import Grades from "component/pages/student/Grades";
import MySchedule from "component/pages/student/MySchedule";
import StudentClassGrades from "component/pages/student/StudentClassGrades";
import StudentAssignmentDetail from "../pages/student/StudentAssignmentDetail";
import StudentQuizStart from "component/pages/student/StudentQuizStart";
import StudentQuizTake from "component/pages/student/StudentQuizTake";
import StudentQuizSummary from "component/pages/student/StudentQuizSummary";
import StudentQuizResult from "component/pages/student/StudentQuizResult";
import StudentQuizReview from "component/pages/student/StudentQuizReview";

// Wrapper to pass classId from URL params to ClassStream
function ClassStreamWrapper() {
  const { classId } = useParams();
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8 xl:col-span-9">
        <ClassStream classId={classId} />
      </div>
      <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
        <StreamNotificationPanel />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const currentUser = store.getCurrentUser();
  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (currentUser.must_change_password) {
    return <Navigate to="/force-change-password" replace />;
  }

  return children;
}

function ForceChangeRoute({ children }) {
  const currentUser = store.getCurrentUser();
  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (!currentUser.must_change_password) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

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
  { path: "/", element: <RootRedirect /> },
  { path: "/forbidden", element: <Forbidden /> },
  
  {
    path: "/force-change-password",
    element: (
      <ForceChangeRoute>
        <ForceChangePassword />
      </ForceChangeRoute>
    ),
  },

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
      { path: "classes/:classId", element: <TeacherClassHome /> },
      { 
        path: "assignments",
        children: [
            { path: "quizzes", element: <QuizList /> },
            { path: "essays", element: <GradingPage /> },
        ]
      },
      { path: "quizzes", element: <QuizList /> }, // Keep for compatibility
      { path: "quizzes/create", element: <QuizCreation /> },
      { path: "classes/:classId/quizzes/create", element: <QuizCreation /> },
      { path: "classes/:classId/assignments", element: <AssignmentManagement /> },
      { path: "classes/:classId/assignments/essay/create", element: <EssayCreation /> },
      { path: "classes/:classId/assignments/essay/edit", element: <EssayCreation /> },
      { path: "grading", element: <GradingPage /> }, // Keep for compatibility
      { path: "notifications", element: <TeacherDashboard /> },
      { path: "classes/:classId/assessments/:assessmentId/submissions", element: <SubmissionList /> },
      { path: "classes/:classId/assessments/:assessmentId/submissions/:submissionId/grade", element: <TeacherGradingWorkspace /> },
      { path: "classes/:classId/quizzes/:quizId/questions", element: <QuizQuestionManager /> },
      { path: "classes/:classId/assessments/:assessmentId/quiz-attempts", element: <QuizAttempts /> },
      { path: "quiz-attempts/:submissionId/review", element: <QuizReviewAttempt /> },
      { path: "classes/:classId/quizzes", element: <QuizList /> },
      { path: "classes/:classId/gradebook", element: <TeacherGradebook /> },
      { path: "classes/:classId/students", element: <TeacherStudentList /> },
      { path: "classes/:classId/stream", element: <ClassStreamWrapper /> },
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
      { path: "schedule", element: <MySchedule /> },
      { path: "materials", element: <StudentDashboard /> },
      { path: "quizzes", element: <StudentDashboard /> },
      { path: "quizzes/:quizId/start", element: <StudentQuizStart /> },
      { path: "attempts/:submissionId/summary", element: <StudentQuizSummary /> },
      { path: "quiz-result", element: <StudentQuizResult /> },
      { path: "attempts/:submissionId/review", element: <StudentQuizReview /> },
      { path: "grades", element: <Grades /> },
      { path: "classes/:classId/grades", element: <StudentClassGrades /> },
      { path: "classes/:classId/assessments/:assessmentId", element: <StudentAssignmentDetail /> },
    ],
  },
  
  // Student Quiz Take - No Layout (Full screen Mode)
  {
    path: "/student/attempts/:submissionId/take",
    element: (
      <ProtectedRoute>
        <StudentQuizTake />
      </ProtectedRoute>
    ),
  },

  { path: "*", element: <NotFound /> },
];