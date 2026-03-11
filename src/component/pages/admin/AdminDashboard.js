// src/component/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent } from "component/ui";
import { Users, BookOpen, Presentation, CalendarCheck, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { adminApi } from "service/adminApi";
import { toast } from "sonner";

const gradeColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

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
                    <p className="font-semibold text-slate-800">{`Grade ${payload[0].name}`}</p>
                    <p className="text-slate-600">{`${payload[0].value} students`}</p>
                </div>
            );
        }
        return null;
    };

    // Custom Tooltip for BarChart
    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                    <p className="font-semibold text-slate-800 mb-1">{label}</p>
                    <p className="text-slate-600 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        {`${payload[0].value} Students`}
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
                    title="Admin Dashboard"
                    subtitle="Welcome back! Here's what's happening today."
                />
                <select 
                    className="w-full sm:w-48 p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                >
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
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
                        label="Total Students" 
                        value={data.statsData.totalStudents.toLocaleString()} 
                        hint={<span className="text-green-600 font-medium">↗ +12% vs last period</span>}
                        icon={<Users size={24} className="text-indigo-600" />}
                        iconBg="bg-indigo-50"
                    />
                    <StatCard 
                        label="Total Teachers" 
                        value={data.statsData.totalTeachers} 
                        hint={<span className="text-green-600 font-medium">↗ +5% vs last period</span>}
                        icon={<Presentation size={24} className="text-fuchsia-600" />}
                        iconBg="bg-fuchsia-50"
                    />
                    <StatCard 
                        label="Active Classes" 
                        value={data.statsData.activeClasses} 
                        hint={<span className="text-green-600 font-medium">↗ +8% vs last period</span>}
                        icon={<BookOpen size={24} className="text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <StatCard 
                        label="Submissions Today" 
                        value={data.statsData.submissionsToday} 
                        hint={<span className="text-red-500 font-medium">↘ -3% vs last period</span>}
                        icon={<CalendarCheck size={24} className="text-orange-600" />}
                        iconBg="bg-orange-50"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Pie Chart */}
                    <Card className="shadow-sm border-slate-200 h-[400px] flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Grade Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center p-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.gradeDistributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                        labelLine={true}
                                    >
                                        {data.gradeDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={gradeColors[index % gradeColors.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomPieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Bar Chart */}
                    <Card className="shadow-sm border-slate-200 h-[400px] flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Students by Course</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 pt-4">
                            <ResponsiveContainer width="100%" height="100%">
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
                                    domain={[0, 60]}
                                    ticks={[0, 15, 30, 45, 60]}
                                />
                                <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activities */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg">Recent Activities</CardTitle>
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