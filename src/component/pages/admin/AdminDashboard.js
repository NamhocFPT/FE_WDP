// src/component/pages/admin/AdminDashboard.js
import React from "react";
import { mock, formatVND } from "service/mockData";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, MiniBarChart, Badge } from "component/ui";

export default function AdminDashboard() {
    return (
        <div>
            <PageHeader
                title="Admin Dashboard"
                subtitle="Overview of users, courses, classes and revenue."
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Users" value={mock.stats.totalUsers} hint="+12 this week" />
                <StatCard label="Total Courses" value={mock.stats.totalCourses} hint="Active catalog" />
                <StatCard label="Total Classes" value={mock.stats.totalClasses} hint="Ongoing" />
                <StatCard label="Revenue" value={formatVND(mock.stats.revenue)} hint="This month" />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Monthly Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MiniBarChart data={mock.monthlyEnroll} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-700">
                        <div className="flex items-center justify-between">
                            <span>Active users</span>
                            <Badge tone="green">1,120</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Inactive users</span>
                            <Badge tone="amber">160</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Pending approvals</span>
                            <Badge tone="blue">7</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}