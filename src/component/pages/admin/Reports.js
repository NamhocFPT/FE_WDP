// src/component/pages/admin/Reports.js
import React, { useState, useEffect, useRef } from "react";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Button } from "component/ui";
import { Download, Loader2, ChevronDown, FileText, Table2, Sheet } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { adminApi } from "service/adminApi";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function Reports() {
    const [semester, setSemester] = useState("");
    const [course, setCourse] = useState("");
    const [dateRange, setDateRange] = useState("This Month");
    const [loading, setLoading] = useState(true);
    const [filtersLoading, setFiltersLoading] = useState(true);
    const [filters, setFilters] = useState({ semesters: [], courses: [] });
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef(null);
    const [activeTab, setActiveTab] = useState('grade'); // 'grade' | 'teacher'
    const [teacherData, setTeacherData] = useState({
        activityChartData: [
            { name: 'Week 1', quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 },
            { name: 'Week 2', quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 },
            { name: 'Week 3', quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 },
            { name: 'Week 4', quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 },
        ],
        totals: { quizzesCreated: 0, materialsUploaded: 0, assignmentsGraded: 0 }
    });
    const [teacherLoading, setTeacherLoading] = useState(false);

    const [data, setData] = useState({
        gradeDistributionData: [],
        gradePercentageData: [],
        courseEnrollmentData: [],
        summaryStats: { avgGrade: 'N/A', passRate: 0, totalStudents: 0, aStudents: 0, gradeTotal: 0, aPercent: 0 }
    });

    // Load filter options from DB on mount
    useEffect(() => {
        adminApi.getReportFilters()
            .then(res => {
                if (res.data.success) {
                    const { semesters, courses } = res.data.data;
                    setFilters({ semesters, courses });
                    if (semesters.length > 0) setSemester(semesters[0]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setFiltersLoading(false));
    }, []);

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

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        adminApi.getReportData(semester, course, dateRange)
            .then(res => {
                if (isMounted && res.data.success) {
                    setData(res.data.data);
                }
            })
            .catch(err => {
                console.error(err);
                if (isMounted) toast.error("Có lỗi xảy ra khi tải báo cáo thống kê");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        
        return () => { isMounted = false; };
    }, [semester, course, dateRange]);

    // Fetch Teacher Activity when tab changes or filters change
    useEffect(() => {
        if (activeTab !== 'teacher') return;
        let isMounted = true;
        setTeacherLoading(true);
        adminApi.getTeacherActivity(semester, course, dateRange)
            .then(res => {
                if (isMounted && res.data.success) setTeacherData(res.data.data);
            })
            .catch(err => console.error(err))
            .finally(() => { if (isMounted) setTeacherLoading(false); });
        return () => { isMounted = false; };
    }, [activeTab, semester, course, dateRange]);

    // Tooltip for Bar Charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                    <p className="font-semibold text-slate-800 mb-1">{`Grade ${label}`}</p>
                    <p className="text-slate-600 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].fill }}></span>
                        {`${payload[0].value} Students`}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Build a common data structure for all export formats
    const buildReportSections = () => {
        const now = new Date();
        const filtersLabel = `Semester: ${semester || 'All'} | Course: ${course || 'All'} | Range: ${dateRange}`;
        return { now, filtersLabel };
    };

    const handleExportCSV = () => {
        const { now, filtersLabel } = buildReportSections();
        const dateStr = now.toLocaleDateString('vi-VN').replace(/\//g, '-');
        const rows = [
            [`Reports & Analytics Export`],
            [`Generated: ${now.toLocaleString('vi-VN')}`],
            [`Filters: ${filtersLabel}`],
            [],
            [`GRADE DISTRIBUTION`],
            [`Grade`, `Students`],
            ...data.gradeDistributionData.map(r => [r.name, r.students]),
            [],
            [`GRADE PERCENTAGE`],
            [`Grade`, `Percentage (%)`],
            ...(data.gradePercentageData.length === 0
                ? [[`No graded data`, ``]]
                : data.gradePercentageData.map(r => [r.name, r.value])),
            [],
            [`COURSE ENROLLMENT STATISTICS`],
            [`Course`, `Students`],
            ...data.courseEnrollmentData.map(r => [r.name, r.students]),
        ];
        const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        triggerDownload(`\uFEFF` + csv, `report_${dateStr}.csv`, 'text/csv;charset=utf-8;');
        toast.success('Đã xuất CSV thành công!');
    };

    const handleExportTXT = () => {
        const { now, filtersLabel } = buildReportSections();
        const dateStr = now.toLocaleDateString('vi-VN').replace(/\//g, '-');
        const sep = '='.repeat(50);
        const lines = [
            sep,
            `  REPORTS & ANALYTICS EXPORT`,
            sep,
            `Generated : ${now.toLocaleString('vi-VN')}`,
            `Filters   : ${filtersLabel}`,
            '',
            `--- GRADE DISTRIBUTION ---`,
            `${'Grade'.padEnd(10)} ${'Students'.padStart(8)}`,
            '-'.repeat(20),
            ...data.gradeDistributionData.map(r => `${r.name.padEnd(10)} ${String(r.students).padStart(8)}`),
            '',
            `--- GRADE PERCENTAGE ---`,
            `${'Grade'.padEnd(20)} ${'Percentage'.padStart(10)}`,
            '-'.repeat(32),
            ...(data.gradePercentageData.length === 0
                ? ['  No graded data available']
                : data.gradePercentageData.map(r => `${r.name.padEnd(20)} ${String(r.value + '%').padStart(10)}`)),
            '',
            `--- COURSE ENROLLMENT ---`,
            `${'Course'.padEnd(30)} ${'Students'.padStart(8)}`,
            '-'.repeat(40),
            ...data.courseEnrollmentData.map(r => `${r.name.padEnd(30)} ${String(r.students).padStart(8)}`),
            '',
            sep,
        ];
        triggerDownload(lines.join('\n'), `report_${dateStr}.txt`, 'text/plain;charset=utf-8;');
        toast.success('Đã xuất TXT thành công!');
    };

    const handleExportExcel = () => {
        const { now, filtersLabel } = buildReportSections();
        const dateStr = now.toLocaleDateString('vi-VN').replace(/\//g, '-');
        const wb = XLSX.utils.book_new();

        // Sheet 1: Grade Distribution
        const ws1Data = [
            ['Reports & Analytics Export'],
            [`Generated: ${now.toLocaleString('vi-VN')}`],
            [`Filters: ${filtersLabel}`],
            [],
            ['GRADE DISTRIBUTION'],
            ['Grade', 'Students'],
            ...data.gradeDistributionData.map(r => [r.name, r.students]),
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
        ws1['!cols'] = [{ wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Grade Distribution');

        // Sheet 2: Grade Percentage
        const ws2Data = [
            ['GRADE PERCENTAGE'],
            ['Grade', 'Percentage (%)'],
            ...(data.gradePercentageData.length === 0
                ? [['No graded data', '']]
                : data.gradePercentageData.map(r => [r.name, r.value])),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
        ws2['!cols'] = [{ wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Grade Percentage');

        // Sheet 3: Course Enrollment
        const ws3Data = [
            ['COURSE ENROLLMENT STATISTICS'],
            ['Course', 'Students'],
            ...data.courseEnrollmentData.map(r => [r.name, r.students]),
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
        ws3['!cols'] = [{ wch: 40 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Course Enrollment');

        XLSX.writeFile(wb, `report_${dateStr}.xlsx`);
        toast.success('Đã xuất Excel thành công!');
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
                    title="Reports & Analytics" 
                    subtitle="View performance metrics and activity reports" 
                />
                {/* Export Dropdown */}
                <div className="relative" ref={exportMenuRef}>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto flex items-center gap-2"
                        onClick={() => setShowExportMenu(v => !v)}
                        disabled={loading}
                    >
                        <Download size={16} />
                        Export Report
                        <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                    </Button>
                    {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                onClick={() => { handleExportCSV(); setShowExportMenu(false); }}
                            >
                                <Table2 size={16} className="text-green-500" />
                                Export CSV (.csv)
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                onClick={() => { handleExportTXT(); setShowExportMenu(false); }}
                            >
                                <FileText size={16} className="text-blue-500" />
                                Export TXT (.txt)
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                onClick={() => { handleExportExcel(); setShowExportMenu(false); }}
                            >
                                <Sheet size={16} className="text-emerald-600" />
                                Export Excel (.xlsx)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester</label>
                            <select 
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                value={semester}
                                onChange={e => setSemester(e.target.value)}
                                disabled={filtersLoading}
                            >
                                <option value="">All Semesters</option>
                                {filters.semesters.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</label>
                            <select 
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                value={course}
                                onChange={e => setCourse(e.target.value)}
                                disabled={filtersLoading}
                            >
                                <option value="">All Courses</option>
                                {filters.courses.map(c => (
                                    <option key={c.id} value={`${c.code} - ${c.name}`}>{c.code} - {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Range</label>
                            <select 
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                value={dateRange}
                                onChange={e => setDateRange(e.target.value)}
                            >
                                <option>This Week</option>
                                <option>This Month</option>
                                <option>This Semester</option>
                                <option>Custom Range</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content Tabs */}
            <div className="flex gap-6 border-b border-slate-200 px-1">
                <button
                    onClick={() => setActiveTab('grade')}
                    className={`pb-3 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${
                        activeTab === 'grade'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Grade Distribution
                </button>
                <button
                    onClick={() => setActiveTab('teacher')}
                    className={`pb-3 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${
                        activeTab === 'teacher'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Teacher Activity
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
                            <CardTitle className="text-base text-slate-800">Grade Distribution</CardTitle>
                            <p className="text-sm text-slate-500">Overall grade breakdown for selected criteria</p>
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
                            <CardTitle className="text-base text-slate-800">Grade Percentage</CardTitle>
                            <p className="text-sm text-slate-500">Distribution by percentage</p>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                            {data.gradePercentageData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="text-sm font-medium">No graded data yet</span>
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
                        <CardTitle className="text-base text-slate-800">Course Enrollment Statistics</CardTitle>
                        <p className="text-sm text-slate-500">Student enrollment by course</p>
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
                                <Bar dataKey="students" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={120} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Summary Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Average Grade',
                            value: data.summaryStats.avgGrade,
                            sub: data.summaryStats.gradeTotal > 0
                                ? `Based on ${data.summaryStats.gradeTotal} grades`
                                : 'No graded data',
                            color: 'text-indigo-600'
                        },
                        {
                            label: 'Pass Rate',
                            value: data.summaryStats.gradeTotal > 0 ? `${data.summaryStats.passRate}%` : 'N/A',
                            sub: data.summaryStats.gradeTotal > 0
                                ? `${data.summaryStats.passRate >= 50 ? '+' : ''}${data.summaryStats.passRate - 50}% vs 50% target`
                                : 'No graded data',
                            color: data.summaryStats.passRate >= 70 ? 'text-green-600' : 'text-amber-500'
                        },
                        {
                            label: 'Total Students',
                            value: data.summaryStats.totalStudents,
                            sub: 'Across all courses',
                            color: 'text-purple-600'
                        },
                        {
                            label: 'A Students',
                            value: data.summaryStats.gradeTotal > 0 ? `${data.summaryStats.aPercent}%` : 'N/A',
                            sub: data.summaryStats.gradeTotal > 0
                                ? `${data.summaryStats.aStudents} out of ${data.summaryStats.gradeTotal} students`
                                : 'No graded data',
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
                            <CardTitle className="text-base text-slate-800">Teacher Activity Over Time</CardTitle>
                            <p className="text-sm text-slate-500">
                                {dateRange === 'This Week' ? 'Daily' : 'Weekly'} activity metrics for selected filters
                            </p>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={teacherData.activityChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dx={-10} allowDecimals={false} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '16px', fontSize: '13px' }} />
                                    <Line type="monotone" dataKey="quizzesCreated" name="Quizzes Created" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="materialsUploaded" name="Materials Uploaded" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                                    <Line type="monotone" dataKey="assignmentsGraded" name="Assignments Graded" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="3 3" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* 3 Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Quizzes Created', value: teacherData.totals.quizzesCreated, sub: dateRange || 'This Month', color: 'text-indigo-600' },
                            { label: 'Materials Uploaded', value: teacherData.totals.materialsUploaded, sub: dateRange || 'This Month', color: 'text-purple-600' },
                            { label: 'Assignments Graded', value: teacherData.totals.assignmentsGraded, sub: dateRange || 'This Month', color: 'text-pink-600' },
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

            {/* Summary Stats Cards — shown only on grade tab */}
            {/* {!loading && activeTab === 'grade' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Average Grade',
                            value: data.summaryStats.avgGrade,
                            sub: data.summaryStats.gradeTotal > 0 ? `Based on ${data.summaryStats.gradeTotal} grades` : 'No graded data',
                            color: 'text-indigo-600'
                        },
                        {
                            label: 'Pass Rate',
                            value: data.summaryStats.gradeTotal > 0 ? `${data.summaryStats.passRate}%` : 'N/A',
                            sub: data.summaryStats.gradeTotal > 0 ? `${data.summaryStats.passRate >= 50 ? '+' : ''}${data.summaryStats.passRate - 50}% vs 50% target` : 'No graded data',
                            color: data.summaryStats.passRate >= 70 ? 'text-green-600' : 'text-amber-500'
                        },
                        {
                            label: 'Total Students',
                            value: data.summaryStats.totalStudents,
                            sub: 'Across all courses',
                            color: 'text-purple-600'
                        },
                        {
                            label: 'A Students',
                            value: data.summaryStats.gradeTotal > 0 ? `${data.summaryStats.aPercent}%` : 'N/A',
                            sub: data.summaryStats.gradeTotal > 0 ? `${data.summaryStats.aStudents} out of ${data.summaryStats.gradeTotal} students` : 'No graded data',
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
            )} */}
        </div>
    );
}