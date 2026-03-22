// src/component/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent } from "component/ui";
import { Users, BookOpen, Presentation, CalendarCheck, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { adminApi } from "service/adminApi";
import { toast } from "sonner";

const gradeColors = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function AdminDashboard() {
    const [timeFilter, setTimeFilter] = useState("Last 30 days");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        statsData: { totalStudents: 0, totalTeachers: 0, activeClasses: 0, submissionsToday: 0 },
        gradeDistributionData: [],
        studentsByCourseData: [],
        recentActivities: []
    });

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        adminApi.getDashboardStats()
            .then(res => {
                if (isMounted && res.data.success) {
                    setData(res.data.data);
                }
            })
            .catch(err => {
                console.error(err);
                if (isMounted) toast.error("Có lỗi xảy ra khi tải dữ liệu thống kê");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        
        return () => { isMounted = false; };
    }, [timeFilter]); // normally time filter would pass to API, currently not implemented at backend

    // Custom Tooltip for PieChart
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                    <p className="font-semibold text-slate-800">{`Điểm ${payload[0].name}`}</p>
                    <p className="text-slate-600">{`${payload[0].value} học sinh`}</p>
                </div>
            );
        }
        return null;
    };

    // Custom Legend for PieChart
    const CustomPieLegend = ({ payload }) => (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span>Điểm {entry.value}</span>
                </div>
            ))}
        </div>
    );

    // Custom Tooltip for BarChart
    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                    <p className="font-semibold text-slate-800 mb-1">{label}</p>
                    <p className="text-slate-600 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        {`${payload[0].value} Học sinh`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Bảng điều khiển Admin"
                    subtitle="Chào mừng trở lại! Dưới đây là tình hình hôm nay."
                />
                <select 
                    className="w-full sm:w-48 p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                >
                    <option>7 ngày qua</option>
                    <option>30 ngày qua</option>
                    <option>90 ngày qua</option>
                </select>
            </div>

            {/* Stat Cards */}
            {loading ? (
                <div className="flex justify-center items-center h-32 w-full">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
            ) : (
                <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                        label="Tổng học sinh" 
                        value={data.statsData.totalStudents.toLocaleString()} 
                        hint={<span className="text-green-600 font-medium">↗ +12% so với kỳ trước</span>}
                        icon={<Users size={24} className="text-indigo-600" />}
                        iconBg="bg-indigo-50"
                    />
                    <StatCard 
                        label="Tổng giáo viên" 
                        value={data.statsData.totalTeachers} 
                        hint={<span className="text-green-600 font-medium">↗ +5% so với kỳ trước</span>}
                        icon={<Presentation size={24} className="text-fuchsia-600" />}
                        iconBg="bg-fuchsia-50"
                    />
                    <StatCard 
                        label="Lớp đang học" 
                        value={data.statsData.activeClasses} 
                        hint={<span className="text-green-600 font-medium">↗ +8% so với kỳ trước</span>}
                        icon={<BookOpen size={24} className="text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <StatCard 
                        label="Bài nộp hôm nay" 
                        value={data.statsData.submissionsToday} 
                        hint={<span className="text-red-500 font-medium">↘ -3% so với kỳ trước</span>}
                        icon={<CalendarCheck size={24} className="text-orange-600" />}
                        iconBg="bg-orange-50"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Donut Pie Chart */}
                    <Card className="shadow-sm border-slate-200 flex flex-col" style={{ height: 400 }}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Phổ điểm hệ thống</CardTitle>
                            <p className="text-sm text-slate-400">Thống kê điểm số của tất cả các bài nộp đã chấm</p>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                            {data.gradeDistributionData.every(d => d.value === 0) ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="text-sm font-medium">Chưa có dữ liệu điểm</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data.gradeDistributionData.filter(d => d.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={false}
                                            labelLine={false}
                                        >
                                            {data.gradeDistributionData.filter(d => d.value > 0).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={gradeColors[data.gradeDistributionData.indexOf(entry) % gradeColors.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip content={<CustomPieTooltip />} />
                                        <Legend
                                            content={<CustomPieLegend />}
                                            formatter={(value) => `Điểm ${value}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bar Chart */}
                    <Card className="shadow-sm border-slate-200 flex flex-col" style={{ height: 400 }}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Học sinh theo môn học</CardTitle>
                            <p className="text-sm text-slate-400">Số lượng học sinh đăng ký theo từng môn học</p>
                        </CardHeader>
                        <CardContent className="flex-1 pt-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.studentsByCourseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                        allowDecimals={false}
                                        domain={[0, 'auto']}
                                    />
                                    <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                    <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
            </div>

            {/* Recent Activities */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 pb-6">
                    <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
                        {data.recentActivities.map((activity, index) => (
                            <div key={activity.id} className="relative pl-6">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white ${activity.color}`}></div>
                                
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">{activity.action}</h4>
                                        <p className="text-sm text-slate-500 mt-0.5">{activity.details}</p>
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap ml-4">
                                        {activity.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            </>
            )}
        </div>
    );
}