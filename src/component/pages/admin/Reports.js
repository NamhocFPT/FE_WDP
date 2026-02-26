// src/component/pages/admin/Reports.js
import React from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, MiniBarChart } from "component/ui";

export default function Reports() {
    const roleCount = mock.users.reduce(
        (acc, u) => ({ ...acc, [u.role]: (acc[u.role] || 0) + 1 }),
        {}
    );

    const data = [
        { month: "A", value: roleCount.admin || 0 },
        { month: "T", value: roleCount.teacher || 0 },
        { month: "S", value: roleCount.student || 0 },
    ];

    return (
        <div>
            <PageHeader title="Reports" subtitle="Basic analytics and reporting (demo UI)." />

            <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle>Users by role</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between"><span>Admin</span><Badge tone="blue">{roleCount.admin || 0}</Badge></div>
                        <div className="flex items-center justify-between"><span>Teacher</span><Badge tone="blue">{roleCount.teacher || 0}</Badge></div>
                        <div className="flex items-center justify-between"><span>Student</span><Badge tone="blue">{roleCount.student || 0}</Badge></div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Simple chart</CardTitle></CardHeader>
                    <CardContent>
                        <MiniBarChart data={data} />
                        <div className="mt-2 text-xs text-slate-500">A=Admin, T=Teacher, S=Student</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}