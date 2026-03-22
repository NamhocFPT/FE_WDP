export const navByRole = {
    admin: [
        { to: "/admin", label: "Tổng quan" },
        { to: "/admin/users", label: "Người dùng" },
        { to: "/admin/courses", label: "Môn học" },
        { 
            to: "/admin/classes", 
            label: "Lớp học",
            children: [
                { to: "/admin/classes", label: "Danh sách lớp" },
                { to: "/admin/classes/attendance", label: "Điểm danh" },
                { to: "/admin/classes/grades", label: "Bảng điểm" },
            ]
        },
        { to: "/admin/schedule", label: "Lịch học" },
        { to: "/admin/reports", label: "Báo cáo" },
    ],
    teacher: [
        { to: "/teacher", label: "Tổng quan" },
        { to: "/teacher/schedule", label: "Lịch dạy" },
        { 
            to: "/teacher/classes", 
            label: "Lớp học",
            children: [
                { to: "/teacher/classes", label: "Danh sách lớp" },
                { to: "/teacher/grading", label: "Chấm điểm" },
            ]
        },
        { to: "/teacher/materials", label: "Học liệu" },
        { 
            to: "/teacher/assignments", 
            label: "",
            children: [
                { to: "/teacher/assignments/quizzes", label: "Trắc nghiệm" },
                { to: "/teacher/assignments/essays", label: "Tự luận" },
            ]
        },
    ],
    student: [
        { to: "/student", label: "Tổng quan" },
        { to: "/student/classes", label: "Lớp của tôi" },
        { to: "/student/schedule", label: "Lịch học" },
        { 
            to: "/student/grades", 
            label: "Kết quả",
            children: [
                { to: "/student/grades", label: "Bảng điểm" },
                { to: "/student/materials", label: "Tài liệu học tập" },
            ]
        },
    ],
};
