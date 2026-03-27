// src/component/pages/admin/Reports.js
import React, { useState, useEffect, useRef } from "react";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Button } from "component/ui";
import {
    Download,
    ChevronDown,
    FileText,
    Table2,
    Sheet,
    Loader2,
    Search,
    FileDown,
    Eye,
    X,
    FileQuestion
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { adminApi } from "service/adminApi";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function Reports() {
    const [semester, setSemester] = useState("");
    const [course, setCourse] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [dateRange, setDateRange] = useState("This Month");
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [filtersLoading, setFiltersLoading] = useState(true);
    const [filters, setFilters] = useState({ semesters: [], courses: [], classes: [] });
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const exportMenuRef = useRef(null);
    const [selectedStudentDetail, setSelectedStudentDetail] = useState(null); // Student details for modal
    const [selectedDetailType, setSelectedDetailType] = useState('ALL'); // 'ALL' | 'QUIZ' | 'ESSAY'
    const [activeTab, setActiveTab] = useState('grade'); // 'grade' | 'teacher'
    const [teacherData, setTeacherData] = useState({
        activityChartData: [
            { name: 'Tuần 1', quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 },
            { name: 'Tuần 2', quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 },
            { name: 'Tuần 3', quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 },
            { name: 'Tuần 4', quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 },
        ],
        totals: { quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 }
    });
    const [teacherLoading, setTeacherLoading] = useState(false);

    const [data, setData] = useState({
        gradeDistributionData: [],
        gradePercentageData: [],
        courseEnrollmentData: [],
        detailedData: [],
        summaryStats: { avgGrade: 'N/A', passRate: 0, totalStudents: 0, aStudents: 0, gradeTotal: 0, aPercent: 0 }
    });

    // Load filter options from DB on mount
    useEffect(() => {
        adminApi.getReportFilters()
            .then(res => {
                if (res.data.success) {
                    const { semesters, courses, classes } = res.data.data;
                    setFilters({ semesters, courses, classes });
                    if (semesters.length > 0) setSemester(semesters[0]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setFiltersLoading(false));
    }, []);

    // Reset selected class when semester or course changes
    useEffect(() => {
        setSelectedClass("");
    }, [semester, course]);

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleViewReport = () => {
        // UC says Mandatory, but Exception E2 implies 'All' can be selected and then warned if too broad.
        // We will allow the request to go through if 'All' is selected, 
        // and handle the 'Phạm vi dữ liệu quá lớn' error from the backend.

        setLoading(true);
        setHasSearched(true);

        const reportPromise = adminApi.getReportData(semester, course, dateRange, selectedClass, startDate, endDate)
            .then(res => {
                if (res.data.success) {
                    const receivedData = res.data.data || {};
                    // Pivot the data for the new table structure
                    const detailedDataRaw = receivedData.detailedData || [];
                    const pivotedStudents = {};
                    const assessmentsMap = {};

                    console.log('[Reports] Raw rows from server:', detailedDataRaw.length);
                    if (detailedDataRaw.length > 0) {
                        console.log('[Reports] Sample item keys:', Object.keys(detailedDataRaw[0]).join(', '));
                    }

                    const getGradeLetter = (score) => {
                        const num = parseFloat(score);
                        if (isNaN(num)) return '-';
                        if (num >= 9) return 'A+';
                        if (num >= 8.5) return 'A';
                        if (num >= 8) return 'B+';
                        if (num >= 7) return 'B';
                        if (num >= 6.5) return 'C+';
                        if (num >= 5.5) return 'C';
                        if (num >= 5) return 'D';
                        return 'F';
                    };

                    detailedDataRaw.forEach(item => {
                        const sId = item.student_id;
                        const cId = item.class_id;
                        const rowKey = `${sId}_${cId}`;

                        if (!pivotedStudents[rowKey]) {
                            pivotedStudents[rowKey] = {
                                student_id: sId,
                                class_id: cId,
                                student_name: item.student_name,
                                class_name: item.class_name,
                                course_code: item.course_code,
                                grades: {},
                                raw_submissions: {} // To store all attempts for calculation
                            };
                        }

                        const assessmentId = item.assessment_id;
                        if (!pivotedStudents[rowKey].raw_submissions[assessmentId]) {
                            pivotedStudents[rowKey].raw_submissions[assessmentId] = [];
                        }
                        
                        // Robust check for date field (handle case sensitivity)
                        const rawSubmittedAt = item.submitted_at || item.SUBMITTED_AT || item.graded_at || item.GRADED_AT;
                        
                        pivotedStudents[rowKey].raw_submissions[assessmentId].push({
                            score: parseFloat(item.score || item.SCORE) || 0,
                            submitted_at: rawSubmittedAt,
                            grade_method: item.assessment_settings?.gradeMethod || 'highest'
                        });

                        if (!assessmentsMap[assessmentId]) {
                            assessmentsMap[assessmentId] = {
                                id: assessmentId,
                                title: item.quiz_name,
                                type: item.type
                            };
                        }
                    });

                    // Perform calculations for each student-assessment pair based on gradeMethod
                    Object.values(pivotedStudents).forEach(student => {
                        Object.keys(student.raw_submissions).forEach(assessmentId => {
                            const attempts = student.raw_submissions[assessmentId];
                            const method = attempts[0].grade_method;
                            let finalScore = 0;

                            if (method === 'average') {
                                const sum = attempts.reduce((acc, curr) => acc + curr.score, 0);
                                finalScore = (sum / attempts.length).toFixed(1);
                            } else if (method === 'latest') {
                                // Sort by submitted_at desc
                                const sorted = [...attempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
                                finalScore = sorted[0].score;
                            } else {
                                // Default: highest
                                finalScore = Math.max(...attempts.map(a => a.score));
                            }

                            student.grades[assessmentId] = {
                                score: finalScore,
                                grade_letter: getGradeLetter(finalScore)
                            };
                        });
                    });

                    // Calculate Summary Stats from pivoted data
                    const studentsArray = Object.values(pivotedStudents);
                    const allFinalScores = studentsArray.flatMap(s => Object.values(s.grades).map(g => parseFloat(g.score)));
                    const avgScore = allFinalScores.length > 0 ? allFinalScores.reduce((a, b) => a + b, 0) / allFinalScores.length : 0;
                    
                    const passCount = allFinalScores.filter(s => s >= 5).length;
                    const passRate = allFinalScores.length > 0 ? (passCount / allFinalScores.length * 100).toFixed(1) : 0;
                    
                    const aCount = allFinalScores.filter(s => s >= 8.5).length;
                    const aPercent = allFinalScores.length > 0 ? (aCount / allFinalScores.length * 100).toFixed(1) : 0;

                    const distribution = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0 };
                    allFinalScores.forEach(s => {
                        const letter = getGradeLetter(s);
                        if (distribution[letter] !== undefined) distribution[letter]++;
                    });

                    setData({
                        gradeDistributionData: Object.entries(distribution).map(([name, count]) => ({ name, students: count })),
                        gradePercentageData: [
                            { name: 'Đạt (>=5)', value: parseFloat(passRate), color: '#10b981' },
                            { name: 'Chưa đạt (<5)', value: 100 - parseFloat(passRate), color: '#ef4444' }
                        ],
                        courseEnrollmentData: receivedData.courseEnrollmentData || [],
                        detailedData: studentsArray,
                        assessments: Object.values(assessmentsMap),
                        summaryStats: {
                            avgGrade: getGradeLetter(avgScore),
                            passRate,
                            totalStudents: studentsArray.length,
                            aStudents: aCount,
                            gradeTotal: allFinalScores.length,
                            aPercent
                        }
                    });
                }
            })
            .catch(err => {
                console.error(err);
                if (err.response && err.response.status === 400) {
                    toast.error(err.response.data.message || "Phạm vi dữ liệu quá lớn để hiển thị cùng lúc.");
                } else {
                    toast.error("Có lỗi xảy ra khi tải báo cáo thống kê");
                }
            });

        const activityPromise = activeTab === 'teacher'
            ? adminApi.getTeacherActivity(semester, course, dateRange, selectedClass, startDate, endDate)
                .then(res => {
                    if (res.data.success) {
                        const receivedTeacher = res.data.data || {};
                        setTeacherData({
                            activityChartData: receivedTeacher.activityChartData || [],
                            totals: receivedTeacher.totals || { quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 }
                        });
                    }
                })
                .catch(err => console.error(err))
            : Promise.resolve();

        Promise.all([reportPromise, activityPromise])
            .finally(() => setLoading(false));
    };

    const handleExportPDF = () => {
        try {
            // Build the export URL with current filter values
            const params = new URLSearchParams({
                semester: semester || "",
                course: course || "",
                dateRange: dateRange || "This Month",
                startDate: startDate || "",
                endDate: endDate || "",
                class_id: selectedClass || "",
                className: (selectedClass && filters?.classes
                    ? filters.classes.find(c => String(c.id) === String(selectedClass))?.name || "Lớp"
                    : "Tất cả Lớp"),
                activeTab: activeTab
            });

            const exportUrl = `http://localhost:9999/api/admin/reports/export/pdf?${params.toString()}`;

            // Trigger download natively to avoid Axios-CORS conflicts with download managers (IDM)
            window.location.href = exportUrl;

            toast.success("Đã bắt đầu xuất PDF!");
        } catch (error) {
            console.error("PDF Export error:", error);
            toast.error("Lỗi khi chuẩn bị xuất PDF");
        }
    };

    // Auto-fetch teacher activity if tab changes and we already searched
    useEffect(() => {
        if (activeTab === 'teacher' && hasSearched) {
            handleViewReport();
        }
    }, [activeTab]);

    // Tooltip for Bar Charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                    <p className="font-semibold text-slate-800 mb-1">{`Điểm ${label}`}</p>
                    <p className="text-slate-600 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].fill }}></span>
                        {`${payload[0].value} Học sinh`}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Build a common data structure for all export formats
    const buildReportSections = () => {
        const now = new Date();
        let dateLabel = "";
        if (dateRange === 'Custom Range') {
            dateLabel = `Từ ${startDate || '?'} đến ${endDate || '?'}`;
        } else {
            dateLabel = dateRange === 'This Week' ? 'Tuần này' : 
                        dateRange === 'This Month' ? 'Tháng này' : 
                        dateRange === 'This Semester' ? 'Học kỳ này' : 'Tùy chỉnh';
        }
        const filtersLabel = `Học kỳ: ${semester || 'Tất cả'} | Môn học: ${course || 'Tất cả'} | Khoảng thời gian: ${dateLabel}`;
        return { now, filtersLabel };
    };

    const handleExportCSV = () => {
        const { now, filtersLabel } = buildReportSections();
        const dateStr = now.toLocaleDateString('vi-VN').replace(/\//g, '-');
        const rows = [
            [`Xuất Báo cáo & Phân tích`],
            [`Ngày tạo: ${now.toLocaleString('vi-VN')}`],
            [`Bộ lọc: ${filtersLabel}`],
            [],
            [`PHÂN BỐ ĐIỂM SỐ`],
            [`Điểm`, `Số lượng học sinh`],
            ... (data?.gradeDistributionData || []).map(r => [r.name, r.students]),
            [],
            [`TỶ LỆ PHẦN TRĂM ĐIỂM`],
            [`Loại điểm`, `Phần trăm (%)`],
            ...((data?.gradePercentageData?.length || 0) === 0
                ? [[`Không có dữ liệu điểm`, ``]]
                : (data?.gradePercentageData || []).map(r => [r.name, r.value])),
            [],
            [`THỐNG KÊ GHI DANH KHÓA HỌC`],
            [`Môn học`, `Số lượng học sinh`],
            ... (data?.courseEnrollmentData || []).map(r => [r.name, r.students]),
        ];
        const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        triggerDownload(`\uFEFF` + csv, `baocao_${dateStr}.csv`, 'text/csv;charset=utf-8;');
        toast.success('Đã xuất CSV thành công!');
    };

    const handleExportTXT = () => {
        const { now, filtersLabel } = buildReportSections();
        const dateStr = now.toLocaleDateString('vi-VN').replace(/\//g, '-');
        const sep = '='.repeat(50);
        const lines = [
            sep,
            `  XUẤT BÁO CÁO & PHÂN TÍCH`,
            sep,
            `Ngày tạo : ${now.toLocaleString('vi-VN')}`,
            `Bộ lọc   : ${filtersLabel}`,
            '',
            `--- PHÂN BỐ ĐIỂM SỐ ---`,
            `${'Điểm'.padEnd(10)} ${'Số lượng'.padStart(10)}`,
            '-'.repeat(25),
            ... (data?.gradeDistributionData || []).map(r => `${r.name.padEnd(10)} ${String(r.students).padStart(10)}`),
            '',
            `--- TỶ LỆ PHẦN TRĂM ĐIỂM ---`,
            `${'Loại điểm'.padEnd(20)} ${'Phần trăm'.padStart(10)}`,
            '-'.repeat(32),
            ...((data?.gradePercentageData?.length || 0) === 0
                ? ['  Chưa có dữ liệu điểm']
                : (data?.gradePercentageData || []).map(r => `${r.name.padEnd(20)} ${String(r.value + '%').padStart(10)}`)),
            '',
            `--- GHI DANH KHÓA HỌC ---`,
            `${'Môn học'.padEnd(30)} ${'Số lượng'.padStart(10)}`,
            '-'.repeat(45),
            ...data.courseEnrollmentData.map(r => `${r.name.padEnd(30)} ${String(r.students).padStart(10)}`),
            '',
            sep,
        ];
        triggerDownload(lines.join('\n'), `baocao_${dateStr}.txt`, 'text/plain;charset=utf-8;');
        toast.success('Đã xuất TXT thành công!');
    };

    const handleExportExcel = () => {
        const { now, filtersLabel } = buildReportSections();
        const dateStr = now.toLocaleDateString('vi-VN').replace(/\//g, '-');
        const wb = XLSX.utils.book_new();

        // Sheet 1: Grade Distribution
        const ws1Data = [
            ['Xuất Báo cáo & Phân tích'],
            [`Ngày tạo: ${now.toLocaleString('vi-VN')}`],
            [`Bộ lọc: ${filtersLabel}`],
            [],
            ['PHÂN BỐ ĐIỂM SỐ'],
            ['Điểm', 'Số lượng học sinh'],
            ... (data?.gradeDistributionData || []).map(r => [r.name, r.students]),
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
        ws1['!cols'] = [{ wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Phân bố điểm');

        // Sheet 2: Grade Percentage
        const ws2Data = [
            ['TỶ LỆ PHẦN TRĂM ĐIỂM'],
            ['Loại điểm', 'Phần trăm (%)'],
            ...((data?.gradePercentageData?.length || 0) === 0
                ? [['Chưa có dữ liệu điểm', '']]
                : (data?.gradePercentageData || []).map(r => [r.name, r.value])),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
        ws2['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Tỷ lệ điểm');

        // Sheet 3: Course Enrollment
        const ws3Data = [
            ['THỐNG KÊ GHI DANH KHÓA HỌC'],
            ['Môn học', 'Số lượng học sinh'],
            ... (data?.courseEnrollmentData || []).map(r => [r.name, r.students]),
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
        ws3['!cols'] = [{ wch: 50 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Ghi danh môn học');

        // Sheet 4: Detailed Data (UC Export Requirement)
        const quizCols = (data?.assessments || []).filter(a => String(a.type).toUpperCase() === 'QUIZ');
        const essayCols = (data?.assessments || []).filter(a => String(a.type).toUpperCase() !== 'QUIZ');

        const headerRow = ['Học sinh', 'Lớp', 'Mã môn'];
        quizCols.forEach(a => headerRow.push(a.title));
        essayCols.forEach(a => headerRow.push(a.title));

        const excelRows = [headerRow];
        (data?.detailedData || []).forEach(s => {
            const row = [s.student_name, s.class_name, s.course_code];
            quizCols.forEach(a => {
                const grade = s.grades[a.id];
                row.push(grade ? `${grade.score} (${grade.grade_letter || '-'})` : '-');
            });
            essayCols.forEach(a => {
                const grade = s.grades[a.id];
                row.push(grade ? `${grade.score} (${grade.grade_letter || '-'})` : '-');
            });
            excelRows.push(row);
        });

        const ws4Data = [
            ['DANH SÁCH CHI TIẾT ĐIỂM SỐ'],
            ['Học kỳ', semester || 'Tất cả'],
            ['Môn học', course || 'Tất cả'],
            ['Lớp học', filters.classes.find(c => c.id === selectedClass)?.name || 'Tất cả'],
            [],
            ...excelRows
        ];
        const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
        ws4['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws4, 'Dữ liệu chi tiết');

        XLSX.writeFile(wb, `baocao_${dateStr}.xlsx`);
        toast.success('Đã xuất Excel thành công!');
    };

    const handleExportIndividual = (student) => {
        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('vi-VN').replace(/\//g, '-');
            const wb = XLSX.utils.book_new();

            const quizCols = (data?.assessments || []).filter(a => String(a.type).toUpperCase() === 'QUIZ');
            const essayCols = (data?.assessments || []).filter(a => String(a.type).toUpperCase() !== 'QUIZ');

            const headerRow = ['Học sinh', 'Lớp', 'Mã môn'];
            quizCols.forEach(a => headerRow.push(a.title));
            essayCols.forEach(a => headerRow.push(a.title));

            const studentRow = [student.student_name, student.class_name, student.course_code];
            quizCols.forEach(a => {
                const grade = student.grades[a.id];
                studentRow.push(grade ? `${grade.score} (${grade.grade_letter || '-'})` : '-');
            });
            essayCols.forEach(a => {
                const grade = student.grades[a.id];
                studentRow.push(grade ? `${grade.score} (${grade.grade_letter || '-'})` : '-');
            });

            const wsData = [
                ['PHIẾU ĐIỂM CÁ NHÂN'],
                ['Ngày trích xuất', now.toLocaleString('vi-VN')],
                ['Học kỳ', semester || 'Tất cả'],
                ['Môn học', course || 'Tất cả'],
                [],
                headerRow,
                studentRow
            ];

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, ws, 'Phiếu điểm');

            XLSX.writeFile(wb, `PhieuDiem_${student.student_name.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
            toast.success(`Đã xuất phiếu điểm cho ${student.student_name}`);
        } catch (error) {
            console.error("Individual Export error:", error);
            toast.error("Lỗi khi xuất phiếu điểm cá nhân");
        }
    };

    const triggerDownload = (content, filename, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Báo cáo & Phân tích"
                    subtitle="Xem các chỉ số hiệu suất và báo cáo hoạt động"
                />
                {/* Export Dropdown */}
                <div className="relative" ref={exportMenuRef}>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto flex items-center gap-2"
                        onClick={() => setShowExportMenu(v => !v)}
                        disabled={loading}
                    >
                        <Download size={16} />
                        Xuất Báo cáo
                        <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                    </Button>
                    {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                onClick={() => { handleExportCSV(); setShowExportMenu(false); }}
                            >
                                <Table2 size={16} className="text-green-500" />
                                Xuất CSV (.csv)
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                onClick={() => { handleExportTXT(); setShowExportMenu(false); }}
                            >
                                <FileText size={16} className="text-blue-500" />
                                Xuất TXT (.txt)
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                onClick={() => { handleExportExcel(); setShowExportMenu(false); }}
                            >
                                <Sheet size={16} className="text-emerald-600" />
                                Xuất Excel (.xlsx)
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                onClick={() => { handleExportPDF(); setShowExportMenu(false); }}
                            >
                                <FileText size={16} className="text-red-500" />
                                Xuất PDF (.pdf)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Bộ lọc</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Học kỳ</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                value={semester}
                                onChange={e => setSemester(e.target.value)}
                                disabled={filtersLoading}
                            >

                                {filters.semesters.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Môn học</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                value={course}
                                onChange={e => setCourse(e.target.value)}
                                disabled={filtersLoading}
                            >
                                <option value="">Tất cả Môn học</option>
                                {filters.courses.map(c => (
                                    <option key={c.id} value={`${c.code} - ${c.name}`}>{c.code} - {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lớp học</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                                disabled={filtersLoading}
                            >
                                <option value="">Tất cả Lớp học</option>
                                {filters.classes
                                    .filter(c => {
                                        const matchSem = !semester || c.semester === semester;
                                        const matchCourse = !course || filters.courses.find(f => f.id === c.course_id)?.code === course.split(" ")[0];
                                        return matchSem && matchCourse;
                                    })
                                    .map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khoảng thời gian</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                value={dateRange}
                                onChange={e => setDateRange(e.target.value)}
                            >
                                <option value="This Week">Tuần này</option>
                                <option value="This Month">Tháng này</option>
                                <option value="This Semester">Học kỳ này</option>
                                <option value="Custom Range">Tùy chỉnh</option>
                            </select>
                        </div>
                        
                        {dateRange === 'Custom Range' && (
                            <>
                                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Từ ngày</label>
                                    <input 
                                        type="date"
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đến ngày</label>
                                    <input 
                                        type="date"
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-1.5 flex flex-col justify-end">
                            <Button
                                onClick={handleViewReport}
                                disabled={loading || filtersLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-[42px] rounded-lg shadow-md shadow-indigo-200"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                Xem báo cáo
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content Tabs */}
            <div className="flex gap-6 border-b border-slate-200 px-1">
                <button
                    onClick={() => setActiveTab('grade')}
                    className={`pb-3 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${activeTab === 'grade'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Phân bố điểm số
                </button>
                <button
                    onClick={() => setActiveTab('teacher')}
                    className={`pb-3 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${activeTab === 'teacher'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Hoạt động Giáo viên
                </button>
            </div>

            {/* Charts Section — switches based on active tab */}
            {activeTab === 'grade' ? (
                loading ? (
                    <div className="flex justify-center items-center h-64 w-full">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : (
                    <>

                        <div className="grid gap-6 lg:grid-cols-2 mt-4">
                            {/* Grade Distribution Bar */}
                            <Card className="shadow-sm border-slate-200 flex flex-col min-h-[400px]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base text-slate-800">Phân bố điểm số</CardTitle>
                                    <p className="text-sm text-slate-500">Thống kê điểm số tổng quát theo tiêu chí đã chọn</p>
                                </CardHeader>
                                <CardContent className="flex-1 pt-4">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={data.gradeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 13 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 13 }}
                                                dx={-10}
                                                domain={[0, 'dataMax']}
                                                allowDecimals={false}
                                            />
                                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                            <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Grade Percentage Donut */}
                            <Card className="shadow-sm border-slate-200 flex flex-col min-h-[400px]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base text-slate-800">Phần trăm xếp loại</CardTitle>
                                    <p className="text-sm text-slate-500">Tỷ lệ phân phối theo phần trăm</p>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                                    {data.gradePercentageData.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <span className="text-sm font-medium">Chưa có dữ liệu điểm</span>
                                        </div>
                                    ) : (
                                        <>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie
                                                        data={data.gradePercentageData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={55}
                                                        outerRadius={95}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        label={false}
                                                        labelLine={false}
                                                    >
                                                        {data.gradePercentageData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                                                        formatter={(value, name) => [`${value}%`, name]}
                                                        itemStyle={{ color: '#1e293b', fontWeight: 500 }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                                                {data.gradePercentageData.map((entry, index) => (
                                                    <div key={index} className="flex items-center gap-1.5 text-sm text-slate-600">
                                                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                                        <span>{entry.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Course Enrollment Statistics Bar */}
                        <Card className="shadow-sm border-slate-200 mb-8 mt-6">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-slate-800">Thống kê Ghi danh Môn học</CardTitle>
                                <p className="text-sm text-slate-500">Số lượng học sinh ghi danh theo từng môn học</p>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={data.courseEnrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 13 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 13 }}
                                            dx={-10}
                                            domain={[0, 'auto']}
                                            allowDecimals={false}
                                        />
                                        <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                                        <Bar dataKey="students" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Summary Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    label: 'Điểm trung bình',
                                    value: data.summaryStats.avgGrade,
                                    sub: data.summaryStats.gradeTotal > 0
                                        ? `Dựa trên ${data.summaryStats.gradeTotal} đầu điểm`
                                        : 'Chưa có dữ liệu',
                                    color: 'text-indigo-600'
                                },
                                {
                                    label: 'Tỷ lệ đạt',
                                    value: data.summaryStats.gradeTotal > 0 ? `${data.summaryStats.passRate}%` : 'N/A',
                                    sub: data.summaryStats.gradeTotal > 0
                                        ? `${data.summaryStats.passRate >= 50 ? '+' : ''}${data.summaryStats.passRate - 50}% so với mục tiêu 50%`
                                        : 'Chưa có dữ liệu',
                                    color: data.summaryStats.passRate >= 70 ? 'text-green-600' : 'text-amber-500'
                                },
                                {
                                    label: 'Tổng Học sinh',
                                    value: data.summaryStats.totalStudents,
                                    sub: 'Trên tất cả môn học',
                                    color: 'text-purple-600'
                                },
                                {
                                    label: 'Học sinh loại A',
                                    value: data.summaryStats.gradeTotal > 0 ? `${data.summaryStats.aPercent}%` : 'N/A',
                                    sub: data.summaryStats.gradeTotal > 0
                                        ? `${data.summaryStats.aStudents} trên tổng số ${data.summaryStats.gradeTotal} học sinh`
                                        : 'Chưa có dữ liệu',
                                    color: 'text-emerald-600'
                                }
                            ].map((stat, i) => (
                                <Card key={i} className="shadow-sm border-slate-200">
                                    <CardContent className="pt-5 pb-5">
                                        <p className="text-sm text-slate-500 mb-2">{stat.label}</p>
                                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                                        <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Detailed Data Table (UC Step 6 - Part 2) */}
                        <Card className="shadow-sm border-slate-200 overflow-hidden mt-6">
                            <CardHeader className="pb-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-800">Bảng dữ liệu chi tiết</CardTitle>
                                    <p className="text-xs text-slate-500 mt-1">Danh sách học sinh và điểm số cụ thể tương ứng với bộ lọc</p>
                                </div>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Tìm tên học sinh..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            {/* Header Grouping Row */}
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th colSpan="4" className="px-4 py-3 border-r border-slate-200"></th>
                                                <th
                                                    className="px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50/50 border-r border-slate-200"
                                                >
                                                    Trắc nghiệm (Quizzes)
                                                </th>
                                                <th
                                                    className="px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/50"
                                                >
                                                    Tự luận (Essays)
                                                </th>
                                            </tr>
                                            <tr className="bg-white border-b border-slate-200">
                                                <th className="px-6 py-3 text-left font-bold text-slate-700 sticky left-0 bg-white z-20">Học sinh</th>
                                                <th className="px-6 py-3 text-left font-bold text-slate-700">Lớp</th>
                                                <th className="px-6 py-3 text-left font-bold text-slate-700">Mã môn</th>
                                                <th className="px-6 py-3 text-center font-bold text-slate-700 border-r border-slate-200">Xuất thông tin</th>
                                                <th className="px-4 py-3 text-center border-r border-slate-200 text-[11px] font-bold uppercase text-slate-500">Xem Trắc nghiệm</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-slate-500">Xem Tự luận</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(() => {
                                                const filteredRows = (data?.detailedData || []).filter(s =>
                                                    !searchTerm || (s.student_name && s.student_name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                );

                                                return filteredRows.length > 0 ? (
                                                    filteredRows.map((student, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-slate-900 border-r sticky left-0 bg-white z-10">{student.student_name}</td>
                                                            <td className="px-6 py-4 text-slate-600 border-r">{student.class_name}</td>
                                                            <td className="px-6 py-4 text-slate-600 border-r">{student.course_code}</td>
                                                            <td className="px-6 py-4 text-center border-r">
                                                                <div className="flex items-center justify-center">
                                                                    <button
                                                                        onClick={() => handleExportIndividual(student)}
                                                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                                        title="Xuất phiếu điểm cá nhân"
                                                                    >
                                                                        <FileDown size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center border-r">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedStudentDetail(student);
                                                                        setSelectedDetailType('QUIZ');
                                                                    }}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all shadow-sm border border-blue-100 hover:scale-110 active:scale-95 mx-auto block"
                                                                    title="Xem chi tiết Trắc nghiệm"
                                                                >
                                                                    <Eye size={20} />
                                                                </button>
                                                            </td>
                                                            <td className="px-4 py-4 text-center border-r">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedStudentDetail(student);
                                                                        setSelectedDetailType('ESSAY');
                                                                    }}
                                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all shadow-sm border border-indigo-100 hover:scale-110 active:scale-95 mx-auto block"
                                                                    title="Xem chi tiết Tự luận"
                                                                >
                                                                    <Eye size={20} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                                            {searchTerm ? `Không tìm thấy học sinh nào khớp với "${searchTerm}"` : "Chưa có dữ liệu bài nộp cho các tiêu chí đã chọn."}
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>

                )
            ) : (
                /* Teacher Activity Tab */
                teacherLoading ? (
                    <div className="flex justify-center items-center h-64 w-full">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : (
                    <>
                        {/* Line Chart */}
                        <Card className="shadow-sm border-slate-200 mt-4">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-slate-800">Cường độ hoạt động Giáo viên</CardTitle>
                                <p className="text-sm text-slate-500">
                                    Chỉ số hoạt động theo {dateRange === 'Tuần này' ? 'ngày' : 'tuần'} dựa trên bộ lọc
                                </p>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={teacherData.activityChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dx={-10} allowDecimals={false} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                                        />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '16px', fontSize: '13px' }} />
                                        <Line type="monotone" dataKey="quizzesCreated" name="Bài trắc nghiệm đã tạo" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="materialsUploaded" name="Học liệu đã tải lên" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey="assignmentsGraded" name="Bài tập đã chấm" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="3 3" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* 3 Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Bài trắc nghiệm đã tạo', value: teacherData.totals.quizzesCreated, sub: dateRange === 'This Month' ? 'Trong tháng này' : (dateRange === 'This Week' ? 'Trong tuần này' : (dateRange === 'This Semester' ? 'Trong học kỳ này' : 'Tùy chỉnh')), color: 'text-indigo-600' },
                                { label: 'Học liệu đã tải lên', value: teacherData.totals.materialsUploaded, sub: dateRange === 'This Month' ? 'Trong tháng này' : (dateRange === 'This Week' ? 'Trong tuần này' : (dateRange === 'This Semester' ? 'Trong học kỳ này' : 'Tùy chỉnh')), color: 'text-purple-600' },
                                { label: 'Bài tập đã chấm', value: teacherData.totals.assignmentsGraded, sub: dateRange === 'This Month' ? 'Trong tháng này' : (dateRange === 'This Week' ? 'Trong tuần này' : (dateRange === 'This Semester' ? 'Trong học kỳ này' : 'Tùy chỉnh')), color: 'text-pink-600' },
                            ].map((stat, i) => (
                                <Card key={i} className="shadow-sm border-slate-200">
                                    <CardContent className="pt-5 pb-5">
                                        <p className="text-sm text-slate-500 mb-2">{stat.label}</p>
                                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                                        <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )
            )}

            {/* Chi tiết bài nộp Modal */}
            {selectedStudentDetail && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Chi tiết {selectedDetailType === 'QUIZ' ? 'Trắc nghiệm' : 'Tự luận'}: {selectedStudentDetail.student_name}</h3>
                                <p className="text-sm text-slate-500 mt-1">Lớp: {selectedStudentDetail.class_name} | Mã môn: {selectedStudentDetail.course_code}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedStudentDetail(null)}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-sm">
                            {(() => {
                                const assessmentsToShow = (data.assessments || [])
                                    .filter(a => {
                                        const hasSubmission = (selectedStudentDetail.raw_submissions[a.id] || []).length > 0;
                                        const typeMatch = selectedDetailType === 'ALL' || 
                                                         (selectedDetailType === 'QUIZ' && String(a.type).toUpperCase() === 'QUIZ') || 
                                                         (selectedDetailType === 'ESSAY' && String(a.type).toUpperCase() !== 'QUIZ');
                                        return hasSubmission && typeMatch;
                                    });

                                return assessmentsToShow.length > 0 ? (
                                    assessmentsToShow.map(assessment => {
                                        const attempts = selectedStudentDetail.raw_submissions[assessment.id] || [];
                                        const method = attempts.length > 0 ? attempts[0].grade_method : 'highest';
                                        const finalGrade = selectedStudentDetail.grades[assessment.id];

                                        return (
                                            <div key={assessment.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${assessment.type === 'QUIZ' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                            {assessment.type === 'QUIZ' ? 'Trắc nghiệm' : 'Tự luận'}
                                                        </span>
                                                        <h4 className="font-bold text-slate-800">{assessment.title}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Cách tính điểm</p>
                                                            <p className="font-medium text-slate-700">{method === 'highest' ? 'Điểm cao nhất' : (method === 'average' ? 'Trung bình' : 'Lần cuối')}</p>
                                                        </div>
                                                        <div className="h-8 w-px bg-slate-200" />
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Điểm tổng kết</p>
                                                            <p className="font-bold text-blue-600 text-lg">{finalGrade ? `${finalGrade.score} (${finalGrade.grade_letter})` : 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-0">
                                                    <table className="w-full text-left">
                                                        <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/30">
                                                            <tr>
                                                                <th className="px-4 py-2 font-semibold">Lần nộp</th>
                                                                <th className="px-4 py-2 font-semibold">Thời gian</th>
                                                                <th className="px-4 py-2 font-semibold text-center">Điểm số</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {attempts.length > 0 ? [...attempts].sort((a,b) => new Date(b.submitted_at) - new Date(a.submitted_at)).map((attempt, i) => (
                                                                <tr key={i} className="hover:bg-slate-50/50">
                                                                    <td className="px-4 py-2.5 text-slate-600">Lần {attempts.length - i}</td>
                                                                    <td className="px-4 py-2.5 text-slate-500">
                                                                        {attempt.submitted_at && !isNaN(new Date(attempt.submitted_at).getTime()) 
                                                                            ? new Date(attempt.submitted_at).toLocaleString('vi-VN') 
                                                                            : 'N/A (No Date)'}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-center font-bold text-slate-700">{attempt.score}</td>
                                                                </tr>
                                                            )) : (
                                                                <tr>
                                                                    <td colSpan="3" className="px-4 py-8 text-center text-slate-400 italic">Học sinh chưa nộp bài.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                            <FileQuestion size={40} className="text-slate-300" />
                                        </div>
                                        <p className="text-base font-medium text-slate-500">Không có dữ liệu bài nộp cho mục này</p>
                                        <p className="text-xs mt-1">Học sinh này chưa tham gia bất kỳ bài {selectedDetailType === 'QUIZ' ? 'trắc nghiệm' : 'tự luận'} nào.</p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <Button onClick={() => setSelectedStudentDetail(null)} variant="outline" className="bg-white">Đóng</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}