// src/service/mockData.js
export const mock = {
    stats: {
        totalUsers: 1280,
        totalCourses: 42,
        totalClasses: 18,
        revenue: 125000000,
    },

    users: [
        { id: "u1", name: "Admin User", email: "admin@smartedu.com", role: "admin", status: "active" },
        { id: "u2", name: "Dr. Sarah Johnson", email: "teacher@smartedu.com", role: "teacher", status: "active" },
        { id: "u3", name: "John Smith", email: "student@smartedu.com", role: "student", status: "active" },
        { id: "u4", name: "Emily Davis", email: "emily@smartedu.com", role: "student", status: "inactive" },
    ],

    courses: [
        { id: "c1", code: "WDP301", title: "Web Development Practices", level: "Intermediate", duration: "10 weeks" },
        { id: "c2", code: "PRM392", title: "Mobile Development", level: "Beginner", duration: "8 weeks" },
        { id: "c3", code: "SWR302", title: "Software Requirements", level: "Intermediate", duration: "6 weeks" },
    ],

    classes: [
        {
            id: "cl1",
            name: "WDP301 - Spring",
            courseId: "c1",
            teacher: "Dr. Sarah Johnson",
            room: "A-203",
            students: ["John Smith", "Emily Davis"],
            schedule: [
                { day: "Mon", time: "08:00 - 10:00" },
                { day: "Wed", time: "08:00 - 10:00" },
            ],
            announcements: [
                { id: "a1", title: "Welcome!", content: "Please check syllabus and grading policy.", date: "2026-02-20" },
            ],
            materials: [
                { id: "m1", title: "Week 1 Slides", type: "PDF", updatedAt: "2026-02-21" },
                { id: "m2", title: "Starter Project", type: "ZIP", updatedAt: "2026-02-22" },
            ],
            assignments: [
                { id: "as1", title: "Lab 01 - Setup", due: "2026-03-03", points: 10 },
                { id: "as2", title: "Lab 02 - Routing", due: "2026-03-07", points: 15 },
            ],
            gradebook: [
                { student: "John Smith", as1: 9, as2: 14 },
                { student: "Emily Davis", as1: 7, as2: 12 },
            ],
        },
    ],

    schedule: [
        { id: "s1", date: "2026-03-02", time: "09:00", endTime: "10:30", title: "CS101-A", teacher: "Dr. Sarah Johnson", location: "Room 301", courseCode: "CS101", role: "teacher" },
        { id: "s2", date: "2026-03-02", time: "11:00", endTime: "12:30", title: "CS201-A", teacher: "Prof. Michael Chen", location: "Room 402", courseCode: "CS201", role: "teacher" },
        { id: "s3", date: "2026-03-03", time: "14:00", endTime: "15:30", title: "CS301-A", teacher: "Dr. Sarah Johnson", location: "Lab 205", courseCode: "CS301", role: "teacher" },
        { id: "s4", date: "2026-03-04", time: "09:00", endTime: "10:30", title: "CS101-A", teacher: "Dr. Sarah Johnson", location: "Room 301", courseCode: "CS101", role: "teacher" },
        { id: "s5", date: "2026-03-05", time: "10:00", endTime: "11:30", title: "WDP301 - Lecture", teacher: "Dr. Sarah Johnson", location: "A-203", courseCode: "WDP301", role: "student" },
    ],

    monthlyEnroll: [
        { month: "Jan", value: 120 },
        { month: "Feb", value: 160 },
        { month: "Mar", value: 140 },
        { month: "Apr", value: 210 },
        { month: "May", value: 180 },
        { month: "Jun", value: 240 },
    ],
};

export function formatVND(n) {
    try {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    } catch {
        return `${n} VND`;
    }
}