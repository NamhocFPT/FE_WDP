// src/component/pages/admin/CourseManagement.js
import React, { useMemo, useState } from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Input, Button, Badge, Table, Th, Td } from "component/ui";

export default function CourseManagement() {
    const [q, setQ] = useState("");

    const rows = useMemo(() => {
        return mock.courses.filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase()));
    }, [q]);

    return (
        <div>
            <PageHeader title="Course Management" subtitle="Manage course catalog and metadata." right={[<Button key="add">Add Course</Button>]} />

            <Card>
                <CardContent>
                    <div className="flex gap-2">
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by code or title..." />
                    </div>

                    <div className="mt-3 overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Code</Th>
                                    <Th>Title</Th>
                                    <Th>Level</Th>
                                    <Th>Duration</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((c) => (
                                    <tr key={c.id}>
                                        <Td className="font-semibold text-slate-900">{c.code}</Td>
                                        <Td>{c.title}</Td>
                                        <Td><Badge tone="amber">{c.level}</Badge></Td>
                                        <Td>{c.duration}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}