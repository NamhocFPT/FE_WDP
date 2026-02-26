// src/component/pages/teacher/GradingPage.js
import React from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Table, Th, Td, Badge, Button } from "component/ui";

export default function GradingPage() {
    const cls = mock.classes[0];
    const rows = cls.students.map((s) => ({
        student: s,
        assignment: cls.assignments[0]?.title,
        status: "submitted",
        score: Math.floor(Math.random() * 3) + 7,
    }));

    return (
        <div>
            <PageHeader title="Grading" subtitle="Review submissions and publish grades." />

            <Card>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Student</Th>
                                    <Th>Assignment</Th>
                                    <Th>Status</Th>
                                    <Th>Score</Th>
                                    <Th></Th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.student}>
                                        <Td className="font-semibold text-slate-900">{r.student}</Td>
                                        <Td>{r.assignment}</Td>
                                        <Td><Badge tone="green">{r.status}</Badge></Td>
                                        <Td><Badge tone="amber">{r.score}</Badge></Td>
                                        <Td><Button variant="outline">Open</Button></Td>
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