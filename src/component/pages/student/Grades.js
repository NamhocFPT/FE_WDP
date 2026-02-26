// src/component/pages/student/Grades.js
import React from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Table, Th, Td, Badge } from "component/ui";

export default function Grades() {
    const cl = mock.classes[0];

    return (
        <div>
            <PageHeader title="Grades" subtitle="Your grades overview (demo)." />

            <Card>
                <CardContent>
                    <div className="text-sm font-semibold text-slate-900">{cl.name}</div>
                    <div className="mt-1 text-xs text-slate-500">Teacher: {cl.teacher}</div>

                    <div className="mt-4 overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Assignment</Th>
                                    <Th>Score</Th>
                                    <Th>Max</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {cl.assignments.map((a) => (
                                    <tr key={a.id}>
                                        <Td className="font-semibold text-slate-900">{a.title}</Td>
                                        <Td><Badge tone="green">{Math.floor(Math.random() * 4) + (a.points - 3)}</Badge></Td>
                                        <Td><Badge tone="amber">{a.points}</Badge></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">* Demo numbers, bạn có thể nối API sau.</div>
                </CardContent>
            </Card>
        </div>
    );
}